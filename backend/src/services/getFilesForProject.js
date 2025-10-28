import { query } from '../../postgresdb.js';

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
