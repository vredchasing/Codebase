import OpenAI from 'openai';

export default class OpenAIWrapper {
  constructor({ apiKey, model }) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Call the LLM with a prompt and optional params.
   * @param {string} prompt - The user prompt
   * @param {object} [options] - Additional options (temperature, max_tokens, etc.)
   * @param {string} [systemPrompt] - Optional system prompt
   * @returns {Promise<string>} The response content
   */
  async call(prompt, options = {}, systemPrompt = null) {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        ...options
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}


//EMBEDDINGS
export class OpenAIEmbeddingWrapper {
  /**
   * @param {object} config
   * @param {string} config.apiKey
   * @param {string} config.model
   */
  constructor({ apiKey, model }) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Create embeddings for one or more inputs.
   * @param {string | string[]} input - The text(s) to embed
   * @param {object} [options] - Additional options (e.g. user, etc.)
   * @returns {Promise<number[][]>} - Returns a list of embedding vectors
   */
  async embed(input, options = {}) {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input,
        ...options,
      });

      // response.data is an array of embeddings
      // Each embedding object: { index, embedding: [...], object }
      const embeddings = response.data.map((d) => d.embedding);
      return embeddings;
    } catch (error) {
      console.error('OpenAI Embedding API error:', error);
      throw error;
    }
  }

  /**
   * Optionally, a helper method: compute cosine similarity between two embeddings.
   * (You could also use a library like `mathjs`).
   * @param {number[]} a
   * @param {number[]} b
   * @returns {number}
   */
  static cosineSimilarity(a, b) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }
}
