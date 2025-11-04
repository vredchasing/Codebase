import express from 'express';
import { query } from '../../../postgresdb.js';
import { decodeToken } from '../../middleware/authMiddleware.js';
import { buildFileTreeWithContent, getFilesForProject } from '../../services/getFilesForProject.js';

const router = express.Router();

router.post('/create-project', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Token not found' });

    const decodedToken = decodeToken(token);
    if (!decodedToken) return res.status(401).json({ message: 'Invalid token' });

    const userId = decodedToken.user.id;
    const { name, description, privacy } = req.body;

    if (!name) return res.status(400).json({ message: 'Project name is required' });

    // Step 1: Create project
    const projectResult = await query(
      `INSERT INTO projects.project (owner_user_id, name, description, privacy, parent_id)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING *;`,
      [userId, name, description || '', privacy || false]
    );
    const newProject = projectResult.rows[0];

    // Step 2: Add user-project relation
    await query(
      `INSERT INTO projects.project_users (user_id, project_id, role)
       VALUES ($1, $2, 'owner');`,
      [userId, newProject.id]
    );

    // Step 3: Create root node (folder)
    const rootContentKey = `root-${newProject.id}-${Date.now()}`;
    const rootNodeResult = await query(
      `INSERT INTO projects.project_node (name, parent_id, project_id, content_key, node_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [name, null, newProject.id, rootContentKey, 'folder']
    );
    const rootNode = rootNodeResult.rows[0];

    // Step 4: (Optional) Link root node to project table
    // await query(
    //   `UPDATE projects.project SET root_node_id = $1 WHERE id = $2`,
    //   [rootNode.id, newProject.id]
    // );

    return res.status(201).json({
      project: newProject,
      rootNode,
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
  const {data} = req.body;
  console.log('Received data for building file tree with content:', data);
  try{
    const mainTreeWithContent = await buildFileTreeWithContent(data);
    return res.json(mainTreeWithContent);
  }
  catch(error){
    console.error('Error building file tree with content:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


export default router;
