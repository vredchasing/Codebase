// =============================================================================
// Agent Framework for Retrieval-Augmented Agents
// =============================================================================

// This module defines the structure and behavior of agents that utilize
// retrieval mechanisms to enhance their capabilities. It includes classes
// and functions to manage agent interactions, retrieval processes, and
// integration with external data sources.

// Agent tools - define what tools the agent has access to to understand and generate the
// best possible responses.

// Execution environment - define the environment in which the agent operates, so it understands
// how to interact with the available tools and data sources.

// Retrieval mechanisms - outline how the agent retrieves relevant information from

// Analysis metrics - define how the agent evaluates given data and conditions, to utilize the
// metrics in its decision-making process.

// Agent orchestration - manage the flow of information between the agent, retrieval systems,
// and external data sources to ensure coherent and contextually relevant responses.

/* 
   ┌───────────────┐
   │  User Query   │
   └───────┬───────┘
           │
           ▼
   ┌─────────────────────┐
   │ transformQuery()    │
   │ - Normalize query   │
   │ - Analyze context   │
   │ - Classify query    │
   └───────┬────────────┘
           │
           ▼
   ┌─────────────────────┐
   │ agentContext        │
   │ - Chat history      │
   │ - Vector DB         │
   │ - Memory / state    │
   └───────┬────────────┘
           │
           ▼
   ┌──────────────────────────────┐
   │ agentOrchestrationLoop()     │
   │ - Branch by classification   │
   │ - Call LLM, retrieve context │
   │ - Execute tools if needed    │
   │ - Multi-step workflows       │
   └───────┬─────────────────────┘
           │
           ▼
   ┌─────────────────────┐
   │ LLM Layer           │
   │ - Receives query +  │
   │   selected context  │
   │ - Generates output  │
   └───────┬────────────┘
           │
           ▼
   ┌─────────────────────┐
   │ Postprocessing      │
   │ - Update memory     │
   │ - Format response   │
   │ - Clarification?    │
   └───────┬────────────┘
           │
           ▼
   ┌───────────────┐
   │ Return Output │
   └───────────────┘
*/

import { transformQuery } from './queryTransformer'

// BRANCHES OF ORCHESTRATION PIPELINE - Dependant on various metrics

//1. Ambiguous query handler - determines if pipeline can continue or if clarification from user is needed
async function handleAmbiguousQuery(transformedQuery, agentContext, llmClient, retriever, toolManager) {
  const query = transformedQuery.query;

  // Step 1: Check if ambiguity can be resolved automatically
  const ambiguityAnalysisPrompt = `
    Analyze this query for ambiguity:
    QUERY: "${query}"
    Consider chat history and vector DB if needed.
    Determine if clarification is required from the user or if a best-effort response can be generated.
    Return JSON with:
    {
      "requiresClarification": true/false,
      "recommendedContext": "chatHistory" | "vectorDB" | "both" | null
    }
  `;

  const analysisResultRaw = await llmClient.generate({ query: ambiguityAnalysisPrompt });
  let analysisResult;
  try {
    analysisResult = JSON.parse(analysisResultRaw);
  } catch (err) {
    console.warn("Failed to parse ambiguity analysis, defaulting to clarification:", err);
    analysisResult = { requiresClarification: true, recommendedContext: null };
  }

  // Step 2: Decide action based on analysis
  if (analysisResult.requiresClarification) {
    // Generate clarifying question to user
    const clarificationPrompt = `The user query is ambiguous: "${query}". What clarifying question should I ask to resolve intent?`;
    const clarificationResponse = await llmClient.generate({ query: clarificationPrompt });
    return { type: "clarification", message: clarificationResponse };
  } else {
    // Attempt best-effort response using recommended context
    let context = null;
    if (analysisResult.recommendedContext === "chatHistory") context = agentContext.chatHistory;
    if (analysisResult.recommendedContext === "vectorDB") context = await retriever.retrieve(query);
    if (analysisResult.recommendedContext === "both") {
      const vectorDocs = await retriever.retrieve(query);
      context = { chatHistory: agentContext.chatHistory, vectorDocs };
    }

    const response = await llmClient.generate({ query, context });
    return { type: "response", message: response };
  }
}

//2. MULTI-STEP QUERY HANDLER 

async function handleMultiStepQuery(transformedQuery){
  
}


//============== MAIN ORCHESTRATOR FOR AGENTIC PIPELINE ===============//
async function agentOrchestrationLoop(query, agentContext, llmClient, retriever, toolManager) {
  const transformedQuery = transformQuery(query);
  const queryInfo = transformedQuery.queryInfo;

  let response;

  switch(queryInfo.classification) {
    case 'SIMPLE_QUERY':
      // Call LLM directly with the query
      response = await llmClient.generate({ query: transformedQuery.query });
      break;

    case 'CHAT_HISTORY_CONTEXT':
      // Provide chat history to the LLM
      response = await llmClient.generate({
        query: transformedQuery.query,
        context: agentContext.chatHistory
      });
      break;

    case 'VECTORDB_CONTEXT':
      // Retrieve relevant documents from vector DB
      const docs = await retriever.retrieve(transformedQuery.query);
      response = await llmClient.generate({
        query: transformedQuery.query,
        context: docs
      });
      break;

    case 'CHAT_HISTORY_VECTORDB_CONTEXT':
      // Combine both chat history and vector DB
      const vectorDocs = await retriever.retrieve(transformedQuery.query);
      const combinedContext = {
        chatHistory: agentContext.chatHistory,
        vectorDocs
      };
      response = await llmClient.generate({
        query: transformedQuery.query,
        context: combinedContext
      });
      break;

    case 'AMBIGUOUS':
      response = await handleAmbiguousQuery(transformedQuery, agentContext, llmClient, retriever, toolManager);
      break;

    case 'TOOL_REQUIRED':
      // Execute tools as needed, then feed outputs to LLM
      const toolOutputs = await toolManager.execute(queryInfo.requiredTools, transformedQuery.query);
      response = await llmClient.generate({
        query: transformedQuery.query,
        context: toolOutputs
      });
      break;

    case 'MULTI_STEP':
      // Possibly orchestrate multiple retrievals / LLM calls
      response = await handleMultiStepQuery(transformedQuery, agentContext, llmClient, retriever, toolManager);
      break;

    default:
      // Fallback
      response = await llmClient.generate({ query: transformedQuery.query });
  }

  return response;
}
