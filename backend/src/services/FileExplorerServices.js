import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../postgresdb.js'; // Assuming your db.js exports the query function

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://afb2329febfba04cd607548195f7b518.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function createFileOrFolder({ name, parentId, projectId, node_type }) {
  const fileId = uuidv4();
  const r2Key = `projects/${projectId}/files/${fileId}-${name}`;

  // Upload an empty file to R2
  await r2.send(new PutObjectCommand({
    Bucket: 'codebase-file-content',
    Key: r2Key,
    Body: '',
  }));

  // Insert metadata into the database
  const queryText = `
    INSERT INTO files (id, name, parent_id, project_id, content_key, node_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [fileId, name, parentId, projectId, r2Key, node_type];

  const res = await query(queryText, values);
  return res.rows[0];
}
