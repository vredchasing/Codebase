import { query } from '../../postgresdb.js';

export async function getFilesForProject(projectId) {
  const { rows } = await query(
    `
    WITH RECURSIVE file_tree AS (
      -- Anchor: root files/folders from project_root
      SELECT
        pr.id AS id,
        CAST(NULL AS INT) AS parent_id,
        pr.project_id,
        pr.name,
        pr.created_at,
        pr.modified_at,
        pr.content_key,
        pr.node_type
      FROM projects.project_root AS pr
      WHERE pr.project_id = $1

      UNION ALL

      -- Recursive: children from project_node
      SELECT
        pn.id AS id,
        pn.parent_id AS parent_id,
        pn.project_id,
        pn.name,
        pn.created_at,
        pn.modified_at,
        pn.content_key,
        pn.node_type
      FROM projects.project_node AS pn
      INNER JOIN file_tree AS ft
        ON pn.parent_id = ft.id
      WHERE pn.project_id = $1
    )
    SELECT *
    FROM file_tree
    ORDER BY parent_id NULLS FIRST, name;
    `,
    [projectId]
  );

  // Fetch the project info separately
  const { rows: projectRows } = await query(
    `SELECT id, name FROM projects.project WHERE id = $1`,
    [projectId]
  );

  if (projectRows.length === 0) return []; // Project not found

  const projectRoot = {
    id: projectRows[0].id,
    name: projectRows[0].name,
    node_type: 'folder',
    children: buildFileTree(rows), // this will be empty if no children exist
  };

  return [projectRoot];
}

function buildFileTree(items, parentId = null) {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildFileTree(items, item.id),
    }));
}
