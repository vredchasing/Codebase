export default class AnthropicWrapper {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model;
    // initialize real client here...
  }

  async call(prompt, options = {}) {
    // Example call structure — replace with real API call
    // e.g., axios POST to anthropic endpoint
    const response = await fakeAnthropicApiCall({
      apiKey: this.apiKey,
      model: this.model,
      prompt,
      ...options
    });
    return response.text;
  }
}
