// =============================================================================
// Agent Query Transformer & Context Requirement Analyzer (Production Ready)
// =============================================================================

/**
 * @file
 * Transforms user queries into structured query info for orchestration.
 * Analyzes query clarity, complexity, context requirements, and execution hints.
 * Does NOT execute tools or make decisions — purely analysis.
 */

import { llmClient } from './llmClient'; // assumed LLM wrapper, replace as needed

// -----------------------------------------------------------------------------
// QUERY DIMENSIONS
// -----------------------------------------------------------------------------
export const QUERY_CLARITY = {
  CLEAR: 'CLEAR',
  AMBIGUOUS: 'AMBIGUOUS'
};

export const QUERY_COMPLEXITY = {
  SINGLE_STEP: 'SINGLE_STEP',
  MULTI_STEP: 'MULTI_STEP'
};

export const CONTEXT_TYPES = {
  CHAT_HISTORY: 'CHAT_HISTORY',
  VECTOR_DB: 'VECTOR_DB'
};

// -----------------------------------------------------------------------------
// STANDARDIZED OUTPUT FORMAT
// -----------------------------------------------------------------------------
export const contextRequirementAnalysisOutputFormat = {
  classification: 'SIMPLE_QUERY | CHAT_HISTORY_CONTEXT | VECTORDB_CONTEXT | CHAT_HISTORY_VECTORDB_CONTEXT | AMBIGUOUS | TOOL_REQUIRED | MULTI_STEP',
  clarity: 'CLEAR | AMBIGUOUS',
  complexity: 'SINGLE_STEP | MULTI_STEP',
  requiredContext: {
    chatHistory: false,
    vectorDB: false
  },
  executionHints: {
    mayRequireTools: false,
    likelyToolTypes: [] // e.g. ["filesystem", "search", "tests"]
  },
  requiredTools: [] // for TOOL_REQUIRED queries
};

// -----------------------------------------------------------------------------
// MAIN QUERY TRANSFORMER
// -----------------------------------------------------------------------------

/**
 * Transforms a user query into structured query info for orchestration.
 * @param {string} query - Raw user query.
 * @returns {Promise<{query: string, queryInfo: object}>}
 */
export async function transformQuery(query) {
  const analyzedQuery = await contextRequirementAnalysis(query);
  return structureTransformedQuery(query, analyzedQuery);
}

/**
 * Structures the output of transformQuery.
 * Guarantees the format { query, queryInfo } for orchestration.
 * @param {string} query
 * @param {object} analyzedQuery
 * @returns {{query: string, queryInfo: object}}
 */
export function structureTransformedQuery(query, analyzedQuery) {
  // Ensure classification exists
  const classification = analyzedQuery.classification || 'SIMPLE_QUERY';
  return {
    query,
    queryInfo: {
      classification,
      ...analyzedQuery
    }
  };
}

// -----------------------------------------------------------------------------
// CONTEXT REQUIREMENT ANALYSIS
// -----------------------------------------------------------------------------

/**
 * Analyzes a query to determine clarity, complexity, context needs, and execution hints.
 * Does NOT execute tools.
 * @param {string} query
 * @returns {Promise<object>} JSON object in the standardized output format
 */
export async function contextRequirementAnalysis(query) {
  const prompt = `
You are an expert query analyst for an AI agent system.
Your job is ONLY to analyze the query — do NOT solve it.

--------------------------------------------------
AVAILABLE DIMENSIONS:

CLARITY:
- CLEAR
- AMBIGUOUS

COMPLEXITY:
- SINGLE_STEP
- MULTI_STEP

CONTEXT TYPES:
- chatHistory
- vectorDB
- both

--------------------------------------------------
IMPORTANT RULES:
1. Do NOT decide which tools to call.
2. If tools MAY be required (grep, read file, run tests, etc),
   set executionHints.mayRequireTools = true.
3. MULTI_STEP means planning or iteration is likely.
4. AMBIGUOUS means user clarification may be required.

--------------------------------------------------
RETURN JSON in EXACTLY THIS FORMAT (wrap in triple-backticks to ensure proper parsing):
\`\`\`json
${JSON.stringify(contextRequirementAnalysisOutputFormat, null, 2)}
\`\`\`

--------------------------------------------------
QUERY:
"""${query}"""
`;

  const rawOutput = await llmClient.generate({ query: prompt });

  try {
    const cleanedOutput = rawOutput.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedOutput);
    // Ensure classification is present
    if (!parsed.classification) parsed.classification = 'SIMPLE_QUERY';
    return parsed;
  } catch (err) {
    console.warn('Failed to parse LLM output as JSON. Returning default structure.', err);
    return { ...contextRequirementAnalysisOutputFormat };
  }
}
