import OpenAI from 'openai';

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


//EMBEDDINGS
export class OpenAIEmbeddingWrapper {
  /**
   * @param {object} config
   * @param {string} config.apiKey
   * @param {string} config.model
   */
  constructor({ apiKey, model }) {
    const configuration = new Configuration({ apiKey });
    this.client = new OpenAIApi(configuration);
    this.model = model;
  }

  /**
   * Create embeddings for one or more inputs.
   * @param {string | string[]} input - The text(s) to embed
   * @param {object} [options] - Additional options (e.g. user, etc.)
   * @returns {Promise<number[][]>} - Returns a list of embedding vectors
   */
  async embed(input, options = {}) {
    const response = await this.client.createEmbedding({
      model: this.model,
      input,
      ...options,
    });

    // response.data.data is an array of embeddings
    // Each embedding object: { index, embedding: [...], object }
    const embeddings = response.data.data.map((d) => d.embedding);
    return embeddings;
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
