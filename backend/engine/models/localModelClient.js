import { LocalEmbeddingWrapper } from "./localEmbeddingModel.js";

export const localModelClient = {
  embedder: new LocalEmbeddingWrapper()
};
