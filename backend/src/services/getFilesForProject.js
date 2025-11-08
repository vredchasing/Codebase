import { query } from '../../postgresdb.js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// R2 client for fetching and updating file content
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://afb2329febfba04cd607548195f7b518.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Fetch content from R2 storage
export async function fetchContentFromStorage(contentKey) {
  if (!contentKey || contentKey === '') {
    return '';
  }

  try {
    const command = new GetObjectCommand({
      Bucket: 'codebase-file-content',
      Key: contentKey,
    });

    const response = await r2.send(command);
    const content = await response.Body.transformToString();
    return content;
  } catch (error) {
    console.error('Error fetching content from R2:', error);
    throw error;
  }
}

export async function getFilesForProject(projectId) {
  const { rows } = await query(
    `
    WITH RECURSIVE file_tree(
      id,
      parent_id,
      project_id,
      name,
      created_at,
      modified_at,
      content_key,
      node_type
    ) AS (
      -- Root nodes (parent_id IS NULL)
      SELECT
        id,
        CAST(NULL AS INT) AS parent_id,
        project_id,
        name,
        created_at,
        modified_at,
        CAST(content_key AS text),
        CAST(node_type AS varchar(10))
      FROM projects.project_node
      WHERE project_id = $1 AND parent_id IS NULL

      UNION ALL

      -- Recursive: children
      SELECT
        pn.id,
        pn.parent_id,
        pn.project_id,
        pn.name,
        pn.created_at,
        pn.modified_at,
        CAST(pn.content_key AS text),
        CAST(pn.node_type AS varchar(10))
      FROM projects.project_node pn
      INNER JOIN file_tree ft
        ON pn.parent_id = ft.id
      WHERE pn.project_id = $1
    )
    SELECT *
    FROM file_tree
    ORDER BY parent_id NULLS FIRST, name;
    `,
    [projectId]
  );

  // Build tree starting from parent_id = NULL
  return buildFileTree(rows);
}

function buildFileTree(items, parentId = null) {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildFileTree(items, item.id),
    }));
}

export async function buildFileTreeWithContent(data) {
  const result = await Promise.all(
    data.map(async (node) => {
      if (node.node_type === 'folder') {
        // ensure children array exists
        const children = node.children || [];
        const updatedChildren = await buildFileTreeWithContent(children);
        return {
          ...node,
          children: updatedChildren,
        };
      } else if (node.node_type === 'file') {
        try {
          const content = await fetchContentFromStorage(node.content_key);
          return {
            ...node,
            content,
          };
        } catch (err) {
          console.error('Failed to fetch content for key', node.content_key, err);
          return {
            ...node,
            content: null,
            error: err,
          };
        }
      } else {
        // unknown type: just return as-is
        return { ...node };
      }
    })
  );
  
  return result;
}
