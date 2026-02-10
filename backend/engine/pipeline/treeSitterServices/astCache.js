// astCache.js
import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";

const parser = new Parser();
parser.setLanguage(JavaScript);

/**
 * Parse initial content
 */
export async function getOldTree(content) {
  return parser.parse(content || "");
}

/**
 * Incremental reparse using Tree-sitter edit optimization
 */
export async function getNewTree(oldTree, newContent) {
  return parser.parse(newContent, oldTree);
}
