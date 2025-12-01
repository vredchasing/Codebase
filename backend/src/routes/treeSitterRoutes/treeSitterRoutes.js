import express from 'express';
import { decodeToken} from '../../middleware/authMiddleware.js';
import { query } from '../../../postgresdb.js';
const router = express.Router();

router.post("/update-ast", async (req, res) => {
  try {
    const { fileId, oldContent, newContent } = req.body;

    const result = updateAST(fileId, oldContent, newContent);

    res.json(result);
  } catch (error) {
    console.error("Error in /update-ast:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});