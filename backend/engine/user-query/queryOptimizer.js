// queryOptimizer.js

import { callLLM } from './llmClient';  // your wrapper for LLM API

/**
 * @param {string} userQuery
 * @returns {Promise<{complexity: string, reasoning: string}>}
 */
export async function classifyComplexity(userQuery) {
  const prompt = `
You are an AI assistant that evaluates how complex a developer task is based on a user’s request.
On a scale: 1 = simple (small change), 2 = medium (feature), 3 = complex (architectural / multi-file refactor).

User query:
"${userQuery}"

Please respond with a JSON object with:
- "complexity": one of ["1", "2", "3"]
- "reasoning": short explanation why
`;
  const resp = await callLLM(prompt);
  // parse JSON out of resp (assume model returns valid JSON)
  let result;
  try {
    result = JSON.parse(resp);
  } catch (e) {
    // fallback: guess or re-call
    result = { complexity: "2", reasoning: resp };
  }
  return result;
}

/**
 * Rewrite user query into a more detailed spec.
 * @param {string} userQuery
 * @param {string} complexity
 * @returns {Promise<{spec: string}>}
 */
export async function rewriteQuery(userQuery, complexity) {
  const prompt = `
You are a software design assistant. Given a user's request, rewrite it into a clear feature specification that a developer / AI agent can act on.
Keep in mind the task complexity is: ${complexity}.

User query:
"${userQuery}"

Please produce a detailed specification including:
- What needs to be done
- Which part(s) of the codebase or file(s) might be involved
- Any likely APIs / state / logic that will be used

Return the spec as a JSON object: { "spec": "..." }.
`;
  const resp = await callLLM(prompt);
  let parsed;
  try {
    parsed = JSON.parse(resp);
  } catch (e) {
    parsed = { spec: resp };
  }
  return parsed;
}

/**
 * Main function: optimize a query.
 */
export async function optimizeQuery(userQuery) {
  const classification = await classifyComplexity(userQuery);
  const rewrite = await rewriteQuery(userQuery, classification.complexity);
  return {
    original: userQuery,
    complexity: classification.complexity,
    reasoning: classification.reasoning,
    spec: rewrite.spec,
  };
}
