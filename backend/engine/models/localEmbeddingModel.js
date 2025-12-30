import { pipeline } from "@xenova/transformers";

export class LocalEmbeddingWrapper {
  constructor() {
    this.modelPromise = null;
  }

  async loadModel() {
    if (!this.modelPromise) {
      this.modelPromise = pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
    }
    return this.modelPromise;
  }

  async embed(input) {
    if (!Array.isArray(input)) input = [input];

    const model = await this.loadModel();

    const vectors = [];
    for (const text of input) {
      const out = await model(text, {
        pooling: "mean",
        normalize: true,
      });
      vectors.push(out.data);
    }

    return vectors;
  }
}
