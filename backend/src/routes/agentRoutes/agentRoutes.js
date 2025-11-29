// server/routes/agentRoutes.js
import express from "express";
import OpenAI from "openai";
import { retrieveEmbeddingsWithContent } from "../../../engine/services/ragRetrievalService.js";
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

  let currentSessionId = sessionId;
  let assistantResponse = "";

  try {
    // Get or create session
    if (!currentSessionId) {
      const newSession = await createChatSession(userId);
      currentSessionId = newSession.session_id;
    } else {
      // Verify session belongs to user
      const session = await getChatSession(currentSessionId);
      if (!session || session.user_id !== userId) {
        res.write("\n[Error: Invalid session]\n");
        res.end();
        return;
      }
    }

    // Save user message
    // Note: senderId is set to null because the database expects UUID but userId is an integer
    // The senderType already indicates this is from a user
    await saveChatMessage(currentSessionId, "user", message, {
      senderId: null,
    });

    // Get chat history for context
    let chatHistory = [];
    try {
      chatHistory = await getChatHistoryForLLM(currentSessionId, {
        limit: 20, // Last 20 messages for context
        condense: false,
      });
    } catch (historyError) {
      console.error("Error retrieving chat history:", historyError);
      // Continue without history
    }

    let systemPrompt = "You are Kira, a helpful and friendly AI assistant. Be concise and conversational.";
    let userMessage = message;

    // If retrieval is enabled and options are provided, perform RAG retrieval
    if (retrievalOptions && retrievalOptions !== null) {
      try {
        console.log("🔍 Performing RAG retrieval with options:", retrievalOptions);
        const retrievedChunks = await retrieveEmbeddingsWithContent(
          message,
          {
            ...retrievalOptions,
            includeContent: true, // Get the actual text content
            topK: retrievalOptions.topK || 5, // Default to 5 chunks
          }
        );

        if (retrievedChunks && retrievedChunks.length > 0) {
          // Build context from retrieved chunks
          const context = retrievedChunks
            .map((chunk, idx) => {
              const fileInfo = chunk.metadata?.file_name || `File ${chunk.fileId}`;
              const chunkText = chunk.text || chunk.metadata?.text || '';
              return `[Context ${idx + 1} from ${fileInfo}]:\n${chunkText}`;
            })
            .join('\n\n');

          // Update system prompt to include retrieval context
          systemPrompt = `You are Kira, a helpful and friendly AI assistant. You have access to relevant code context from the user's codebase. Use this context to provide accurate, code-aware responses. Be concise and conversational.

Relevant Code Context:
${context}

When answering questions, reference the code context when relevant. If the context doesn't contain relevant information, say so.`;

          console.log(`✅ Retrieved ${retrievedChunks.length} chunks for context`);
        } else {
          console.log("⚠️ No relevant chunks found for query");
        }
      } catch (retrievalError) {
        console.error("❌ Error during RAG retrieval:", retrievalError);
        // Continue without retrieval context - don't break the chat
      }
    }

    // Build messages array with history
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...chatHistory,
      { role: "user", content: userMessage },
    ];

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      if (token) {
        assistantResponse += token;
        res.write(token);
      }
    }

    // Save assistant response
    try {
      await saveChatMessage(currentSessionId, "assistant", assistantResponse, {
        senderId: null,
      });
    } catch (saveError) {
      console.error("Error saving assistant message:", saveError);
      // Don't fail the request if saving fails
    }

    // Send session ID in a special format at the end (for frontend to capture)
    res.write(`\n\n[SESSION_ID:${currentSessionId}]`);
    res.end();
  } catch (err) {
    console.error("Groq streaming error:", err);
    res.write("\n[Error connecting to Groq API]\n");
    
    // Try to save error message if we have a session
    if (currentSessionId) {
      try {
        await saveChatMessage(
          currentSessionId,
          "assistant",
          "[Error: Failed to get response from AI]",
          { senderId: null }
        );
      } catch (saveError) {
        console.error("Error saving error message:", saveError);
      }
    }
    
    res.end();
  }
});

export default router;
