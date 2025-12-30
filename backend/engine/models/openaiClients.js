import OpenAIWrapper, { OpenAIEmbeddingWrapper } from "./openAI.js";

export const openaiClients = {
  generate: new OpenAIWrapper({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4.1"
  }),

  embedder: new OpenAIEmbeddingWrapper({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large"
  })
};
