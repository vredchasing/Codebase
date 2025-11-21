import { OpenAIEmbeddingWrapper } from "../models/openAI";


export function retrieveEmbeddings (query){

  //match query embedder model with vector db embedder
  const queryEmbedder = new OpenAIEmbeddingWrapper({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-ada-002"
  })

  const queryEmbedded = queryEmbedder.embed(query);

  

};