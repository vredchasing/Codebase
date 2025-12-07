import express from 'express';
import { query } from '../../../postgresdb.js';
import { decodeToken } from '../../middleware/authMiddleware.js';
import { buildFileTreeWithContent, getFilesForProject } from '../../services/getFilesForProject.js';
import { updateFileContent } from '../../services/FileExplorerServices.js';

const router = express.Router();

router.post('/create-project', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }

    const decodedToken = decodeToken(token);
    if (!decodedToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decodedToken.user.id;
    const { name, description = '', privacy = false } = req.body;

    if (!name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Step 1: Create project
    const projectResult = await query(
      `INSERT INTO projects.project (owner_user_id, name, description, privacy, parent_id)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING *;`,
      [userId, name, description, privacy]
    );
    const newProject = projectResult.rows[0];

    // Step 2: Link user to project as owner
    await query(
      `INSERT INTO projects.project_users (user_id, project_id, role)
       VALUES ($1, $2, 'owner');`,
      [userId, newProject.id]
    );

    // Step 3: Create the root folder node for the project
    const rootContentKey = `root-${newProject.id}-${Date.now()}`;
    const rootNodeResult = await query(
      `INSERT INTO projects.project_node (name, parent_id, project_id, content_key, node_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [name, null, newProject.id, rootContentKey, 'folder']
    );
    const rootNode = rootNodeResult.rows[0];

    // Step 4: Create default UI state entry
    const now = new Date().toISOString();
    const defaultUIState = {
      projectId: newProject.id,
      scrollPositions: {},
      openedFolders: [],
      openedTabs: [],
      activeFile: null,
      layout: 'default',
      lastUpdated: now
    };

    const uiStateResult = await query(
      `INSERT INTO projects.workspace_ui_state (project_id, user_id, ui_state, last_updated)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [newProject.id, userId, JSON.stringify(defaultUIState), now]
    );
    const projectUI = uiStateResult.rows[0];

    // Step 5: Return all created/linked data
    return res.status(201).json({
      project: newProject,
      rootNode,
      uiState: projectUI
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.get('/get-project/:projectId', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Token not found' });

    const decodedToken = decodeToken(token);
    if (!decodedToken) return res.status(401).json({ message: 'Invalid token' });

    const projectId = Number(req.params.projectId);
    const files = await getFilesForProject(projectId);

    return res.json(files);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/get-file-tree-content', async (req, res) => {
  const { data } = req.body;
  console.log('Received data for building file tree with content:', data);
  try {
    const mainTreeWithContent = await buildFileTreeWithContent(data);
    return res.json(mainTreeWithContent);
  } catch (error) {
    console.error('Error building file tree with content:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/updateFile', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Token not found' });

    const decodedToken = decodeToken(token);
    if (!decodedToken) return res.status(401).json({ message: 'Invalid token' });

    const { fileName, content, fileId, projectId } = req.body;

    if (!fileName && !fileId) {
      return res.status(400).json({ message: 'File name or file ID is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ message: 'Content is required' });
    }

    let resolvedFileId = fileId;
    let resolvedProjectId = projectId;

    // If fileId not provided, find it by fileName and projectId
    if (!resolvedFileId) {
      if (!resolvedProjectId) {
        return res.status(400).json({ message: 'Project ID is required when file ID is not provided' });
      }

      const findFileQuery = `
        SELECT id, project_id 
        FROM projects.project_node 
        WHERE name = $1 AND project_id = $2 AND node_type = 'file'
        LIMIT 1
      `;
      const fileResult = await query(findFileQuery, [fileName, resolvedProjectId]);
      
      if (fileResult.rows.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }

      resolvedFileId = fileResult.rows[0].id;
      resolvedProjectId = fileResult.rows[0].project_id;
    }

    // If projectId not provided, get it from the file
    if (!resolvedProjectId) {
      const fileQuery = `
        SELECT project_id 
        FROM projects.project_node 
        WHERE id = $1
      `;
      const fileResult = await query(fileQuery, [resolvedFileId]);
      
      if (fileResult.rows.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }

      resolvedProjectId = fileResult.rows[0].project_id;
    }

    // Update the file content
    const updatedFile = await updateFileContent({
      userId: decodedToken.user.id,
      fileId: resolvedFileId,
      fileName,
      content: content || '',
      projectId: resolvedProjectId,
    });

    return res.json({ 
      success: true, 
      message: 'File updated successfully',
      file: updatedFile 
    });
  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
