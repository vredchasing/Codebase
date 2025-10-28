import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../postgresdb.js';

dotenv.config();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://afb2329febfba04cd607548195f7b518.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function createFileOrFolder({ name, parentId, projectId, nodeType }) {
  console.log('Project ID:', projectId);

  // Resolve parentId if creating under root
  let resolvedParentId = parentId;
  if (!resolvedParentId) {
    const rootQuery = `
      SELECT id FROM projects.project_node
      WHERE project_id = $1 AND parent_id IS NULL
      LIMIT 1;
    `;
    const rootResult = await query(rootQuery, [projectId]);
    if (!rootResult.rows.length) {
      throw new Error(`No root node found for project ${projectId}`);
    }
    resolvedParentId = rootResult.rows[0].id;
  }

  console.log('Resolved Parent ID:', resolvedParentId);

  // Generate UUID and R2 key (only relevant for files)
  const fileUuid = uuidv4();
  const r2Key = `projects/${projectId}/files/${fileUuid}-${name}`;

  // Only upload to R2 if this is a file
  let contentKey = null;
  if (nodeType === 'file') {
    console.log('Uploading file to R2...');
    await r2.send(
      new PutObjectCommand({
        Bucket: 'codebase-file-content',
        Key: r2Key,
        Body: '', // empty file
      })
    );
    contentKey = r2Key;
  } else {
    // For folders, set contentKey to an empty string to satisfy NOT NULL constraint
    contentKey = '';
  }

  // Insert into project_node
  const insertQuery = `
    INSERT INTO projects.project_node (name, parent_id, project_id, content_key, node_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [name, resolvedParentId, projectId, contentKey, nodeType];
  const res = await query(insertQuery, values);

  console.log('Inserted row:', res.rows[0]);
  return res.rows[0];
}
