import express from 'express';
import { createFileOrFolder } from '../../services/FileExplorerServices.js';

const router = express.Router();

router.post('/file-folder-creation', async (req, res) => {
  const { name, parentId, projectId, nodeType } = req.body;

  try {
    const newFile = await createFileOrFolder({ name, parentId, projectId, nodeType });
    console.log('function working')
    res.status(201).json(newFile);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating file or folder');
  }
});

export default router;
