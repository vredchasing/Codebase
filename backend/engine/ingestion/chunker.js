import fs from 'node:fs/promises';
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';

async function chunkFile(filePath) {
  const code = await fs.readFile(filePath, 'utf8');

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
        file:    filePath,
        type:    node.type,
        name:    node.childForFieldName('name')?.text || null,
        startRow,
        endRow,
        text:    chunkText,
      });
    }

    for (const child of node.namedChildren) {
      traverse(child);
    }
  }

  traverse(root);
  return chunks;
}

export { chunkFile };
