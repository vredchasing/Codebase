import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';

/**
 * Parse a file node from the tree structure (with content already loaded from DB)
 * @param {Object} fileNode - File node from tree with structure: { id, name, node_type: 'file', content, content_key, project_id, ... }
 * @returns {Array} Array of parsed chunks
 */
async function parseFile(fileNode) {
  // Extract content from the file node (already loaded from DB/storage)
  const code = fileNode.content || '';
  
  if (!code) {
    console.warn(`No content found for file: ${fileNode.name} (id: ${fileNode.id})`);
    return [];
  }

  const parser = new Parser();
  parser.setLanguage(JavaScript);

  const tree = parser.parse(code);
  const root = tree.rootNode;

  const chunks = [];

  function traverse(node) {
    if (node.type === 'function_declaration' || node.type === 'class_declaration') {
      const { row: startRow } = node.startPosition;
      const { row: endRow }   = node.endPosition;
      const lines = code.split('\n').slice(startRow, endRow + 1);
      const chunkText = lines.join('\n');

      chunks.push({
        file_id:    fileNode.id,
        file_name:  fileNode.name,
        file_path:  fileNode.name, // Using name as path identifier
        type:       node.type,
        name:       node.childForFieldName('name')?.text || null,
        startRow,
        endRow,
        text:       chunkText,
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
  return chunks;
}

/**
 * Parse all files from a tree structure (recursively processes folders)
 * @param {Array} treeNodes - Array of tree nodes (files and folders)
 * @returns {Promise<Array>} Array of all parsed chunks from all files
 */
async function parseFileTree(treeNodes) {
  const allChunks = [];

  for (const node of treeNodes) {
    if (node.node_type === 'file') {
      const chunks = await parseFile(node);
      allChunks.push(...chunks);
    } else if (node.node_type === 'folder' && node.children) {
      // Recursively process children
      const childChunks = await parseFileTree(node.children);
      allChunks.push(...childChunks);
    }
  }

  return allChunks;
}

export { parseFile, parseFileTree };
