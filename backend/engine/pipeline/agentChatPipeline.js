import { optimizeQuery } from "../user-query/queryOptimizer";
import { localModelClient } from "../models/localModelClient";
import { query } from "../../postgresdb";

export async function triggerAgentChatPipeline(query, retrievalSettings) {
  //optimize query 
  const optimizedQuery = await optimizeQuery(query);
  //embed query
  const embeddedQuery = await localModelClient.embedder.embed(optimizedQuery);
  //retrieve context
  const context = await similaritySearch(embeddedQuery, retrievalSettings.topK);
}

async function similaritySearch(embeddedQuery, topK = 5) {
  
}