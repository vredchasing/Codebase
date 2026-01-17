// server/routes/agentRoutes.js
import express from "express";
import OpenAI from "openai";
import { verifyToken } from "../../middleware/authMiddleware.js";
import {
  getChatHistoryForLLM,
  saveChatMessage,
  getChatSession,
  createChatSession,
} from "../../services/chatService.js";

const router = express.Router();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

router.post("/stream", verifyToken, async (req, res) => {
  const { message, retrievalOptions, sessionId } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Streaming headers
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders?.();

  
});

export default router;
