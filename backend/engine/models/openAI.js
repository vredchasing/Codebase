import { Configuration, OpenAIApi } from 'openai';
import { loadPrompt } from './promptTemplates.js';

export default class OpenAIWrapper {
  constructor({ apiKey, model }) {
    const config = new Configuration({ apiKey });
    this.client = new OpenAIApi(config);
    this.model = model;
  }

  /**
   * Call the LLM with a prompt and optional params.
   * @param {string} prompt
   * @param {object} [options]
   */
  async call(prompt, options = {}) {
    // Example: build request
    const resp = await this.client.createChatCompletion({
      model: this.model,
      messages: [
        { role: 'system', content: loadPrompt('system') },
        { role: 'user', content: prompt }
      ],
      ...options
    });

    // Return response content
    const msg = resp.data.choices[0].message;
    return msg.content;
  }
}
