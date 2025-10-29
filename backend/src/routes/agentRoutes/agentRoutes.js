// server/routes/agentRoutes.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

router.post("/stream", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Streaming headers
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders?.();

  try {
    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are Kira, a helpful and friendly AI assistant. Be concise and conversational.",
        },
        { role: "user", content: message },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      res.write(token);
    }

    res.end();
  } catch (err) {
    console.error("Groq streaming error:", err);
    res.write("\n[Error connecting to Groq API]\n");
    res.end();
  }
});

export default router;
