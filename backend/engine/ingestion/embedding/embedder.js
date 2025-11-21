import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import { OpenAIEmbeddingWrapper } from "../../models/openAI.js";

/**
 * Embed chunks for a file node from the tree structure (with content already loaded from DB)
 * @param {Object} fileNode - File node from tree with structure: { id, name, node_type: 'file', content, content_key, project_id, ... }
 * @param {Object} metaData - Additional metadata to attach to chunks
 * @returns {Promise<Array>} Array of embedded chunks
 */
async function embedChunksForFile(fileNode, metaData = {}) {
  // 1. Extract content from the file node (already loaded from DB/storage)
  const code = fileNode.content || '';
  
  if (!code) {
    console.warn(`No content found for file: ${fileNode.name} (id: ${fileNode.id})`);
    return [];
  }

  // 2. Parse and chunk the file
  const parser = new Parser();
  parser.setLanguage(JavaScript);
  const tree = parser.parse(code);
  const root = tree.rootNode;

  const chunks = [];

  function traverse(node) {
    // You could expand this to more node types if needed
    if (node.type === "function_declaration" || node.type === "class_declaration") {
      const startRow = node.startPosition.row;
      const endRow = node.endPosition.row;
      // Extract lines
      const lines = code.split("\n").slice(startRow, endRow + 1);
      const text = lines.join("\n");
      const nameNode = node.childForFieldName("name");
      const name = nameNode ? nameNode.text : null;

      chunks.push({
        file_id:    fileNode.id,
        file_name:  fileNode.name,
        file_path:  fileNode.name, // Using name as path identifier
        type:       node.type,
        name,
        startRow,
        endRow,
        text,
        // Include metadata from file node
        project_id: fileNode.project_id,
        content_key: fileNode.content_key,
      });
    }

    for (const child of node.namedChildren) {
      traverse(child);
    }
  }

  traverse(root);

  if (chunks.length === 0) {
    return [];
  }

  // 3. Embed the chunks
  const embedder = new OpenAIEmbeddingWrapper({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-ada-002", // or your model
  });

  const texts = chunks.map((c) => c.text);
  let embeddings;
  try {
    embeddings = await embedder.embed(texts);
  } catch (err) {
    console.error("Error embedding chunks for file", fileNode.name, err);
    throw err;
  }

  // 4. Combine embeddings + metadata
  const embeddedChunks = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
    meta: {
      ...metaData,
      // Merge file node metadata into meta
      project_id: fileNode.project_id,
      file_id: fileNode.id,
      file_name: fileNode.name,
      content_key: fileNode.content_key,
    },
  }));

  // 5. Return or persist these
  // For now, return them; you could also insert into a vector DB here
  return embeddedChunks;
}

/**
 * Embed chunks for all files in a tree structure (recursively processes folders)
 * @param {Array} treeNodes - Array of tree nodes (files and folders)
 * @param {Object} metaData - Additional metadata to attach to chunks
 * @returns {Promise<Array>} Array of all embedded chunks from all files
 */
async function embedChunksForFileTree(treeNodes, metaData = {}) {
  const allEmbeddedChunks = [];

  for (const node of treeNodes) {
    if (node.node_type === 'file') {
      const embeddedChunks = await embedChunksForFile(node, metaData);
      allEmbeddedChunks.push(...embeddedChunks);
    } else if (node.node_type === 'folder' && node.children) {
      // Recursively process children
      const childChunks = await embedChunksForFileTree(node.children, metaData);
      allEmbeddedChunks.push(...childChunks);
    }
  }

  return allEmbeddedChunks;
}

export { embedChunksForFile, embedChunksForFileTree };
