import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../postgresdb.js';
import redis from '../../redis/redisClient.js';
import { triggerRAGPipelineForFile } from '../../engine/pipeline/treeSitterServices/astPipeline.js';

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


// get old content function for incremental AST update
async function getOldContentFromR2(contentKey) {
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: 'codebase-file-content',
      Key: contentKey,
    })
  );

  return await response.Body.transformToString();
}


// Update file content in R2 and database
export async function updateFileContent({ userId, fileId, content, projectId, actionId = null, wsServer = null }) {
  try {
    // 1) Lookup file metadata
    const { rows } = await query(
      `SELECT content_key FROM projects.project_node 
       WHERE id=$1 AND project_id=$2 AND node_type='file'`,
      [fileId, projectId]
    );

    if (!rows.length) throw new Error("File not found");
    const contentKey = rows[0].content_key;
    if (!contentKey) throw new Error("Missing content_key");

    // 2) Fetch OLD content from R2
    const oldContent = await getOldContentFromR2(contentKey);

    // 3) Upload NEW content to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: 'codebase-file-content',
        Key: contentKey,
        Body: content ?? "",
      })
    );

    // 4) Update modified timestamp
    await query(
      `UPDATE projects.project_node SET modified_at = NOW() WHERE id=$1`,
      [fileId]
    );

    // 5) Trigger incremental AST pipeline
    if (content?.trim()) {
      triggerRAGPipelineForFile(
        userId,
        fileId,
        projectId,
        oldContent,
        content,
        actionId,
        wsServer
      );
    }

    return { success: true };
  } catch (err) {
    console.error("updateFileContent failed:", err);
    throw err;
  }
}
