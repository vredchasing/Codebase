import express from 'express';
import { query } from '../../../postgresdb.js';
import { decodeToken } from '../../middleware/authMiddleware.js';

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

    // Insert new project
    const projectResult = await query(
      `INSERT INTO projects.project (owner_user_id, name, description, privacy, parent_id)
       VALUES ($1, $2, $3, $4, NULL) RETURNING *`,
      [userId, name, description || '', privacy || false]
    );

    const newProject = projectResult.rows[0];

    // Insert into project_users as 'owner'
    await query(
      `INSERT INTO projects.project_users (user_id, project_id, role)
       VALUES ($1, $2, 'owner')`,
      [userId, newProject.id]
    );

    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/get-project/:projectId', async(req, res)=>{
  try{
    const projectId = req.params;  
    const files = getFilesForProject(projectId);
    res.json(files);
  }
  catch(error){
    console.log(error)
  }
  
})

export default router;