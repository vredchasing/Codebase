// /backend/src/routes/index.js
import express from 'express';
import { sendMessage } from '../services/kiraService.js';

const router = express.Router();

router.post('/api/chat', async (req, res) => {
  const { prompt, history } = req.body;
  try {
    const response = await sendMessage(prompt, history);
    res.json(response);
    console.log('test2')
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
