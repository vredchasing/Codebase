import AnthropicWrapper from './anthropic.js';
import OpenAIWrapper from './openAI.js';

/**
 ****** OPENAI MODELS ******
 * Factory / router for different OpenAI LLM configurations.
 * @param {string} type - A key to choose which variant of OpenAI model to use
 * @returns {OpenAIWrapper}
 */
export function getOpenAIModel(type) {
  switch (type) {
    case 'cheap':
      return new OpenAIWrapper({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo'  // low-cost, good for simple tasks
      });

    case 'balanced':
      return new OpenAIWrapper({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4'  // more powerful, more expensive
      });

    case 'highQuality':
      return new OpenAIWrapper({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-32k'  // for large context / more complex tasks
      });

    // Add more variants if needed (e.g. 4-turbo, other OpenAI models)
    case 'turbo':
      return new OpenAIWrapper({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo'  // if you want a faster or cheaper turbo-variant
      });

    default:
      throw new Error(`Unsupported OpenAI model type: ${type}`);
  }
}

/**
 * Call LLM with a prompt (convenience function)
 * @param {string} prompt - The prompt to send
 * @param {string} [modelType='cheap'] - Model type: 'cheap', 'balanced', 'highQuality', 'turbo'
 * @param {object} [options] - Additional options for the LLM call
 * @returns {Promise<string>} The LLM response
 */
export async function callLLM(prompt, modelType = 'cheap', options = {}) {
  const model = getOpenAIModel(modelType);
  return await model.call(prompt, options);
}

/* 
  model prompts
  -default prompt
  -query complexity analysis
  -plan prompt
  -

*/



/* ANTHROPIC MODELS */

