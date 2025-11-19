import AnthropicWrapper from './anthropicWrapper.js';
import OpenAIWrapper from './openaiWrapper.js';

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

/* 
  model prompts
  -default prompt
  -query complexity analysis
  -plan prompt
  -

*/



/* ANTHROPIC MODELS */

