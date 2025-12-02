import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import crypto from 'crypto';
import { query } from '../../postgresdb.js';
import { OpenAIEmbeddingWrapper } from "../models/openAI.js";

const parser = new Parser();
parser.setLanguage(JavaScript);
//***************Distributed / multi-node scalable setup with Redis:************/

// Code and pipeline need to be fixed to store sessions in Redis or another distributed store
// to support tree-sitter incremental parsing, current code is incorrect, will address later

// Temp In-memory session store for incremental parsing
// In production, replace with Redis or another distributed store
const fileSessions = {};

/**
 * Update the AST for a file incrementally
 * @param {string} fileId
 * @param {string} oldContent
 * @param {string} newContent
 * @returns {Object} { changedRanges, tree }
 */
export function updateAST(fileId, oldContent, newContent) {
  let session = fileSessions[fileId];

  if (!session) {
    session = {
      text: oldContent,
      tree: parser.parse(oldContent),
      lastUpdated: Date.now()
    };
    fileSessions[fileId] = session;
    console.log(fileSessions)
  }
  const newTree = parser.parse(newContent, session.tree);
  const changedRanges = newTree.getChangedRanges(session.tree);

  session.text = newContent;
  session.tree = newTree;
  session.lastUpdated = Date.now();

  return { changedRanges, tree: newTree };
}

/**
 * Extract changed AST nodes given changed ranges
 * @param {Tree} tree
 * @param {Array} changedRanges
 */

export function extractChangedNodes(tree, changedRanges) {
  const changedNodes = [];

  for (const r of changedRanges) {
    const cursor = tree.walk();

    const start = tree.rootNode.positionAt(r.startIndex);
    const end = tree.rootNode.positionAt(r.endIndex);

    const startRow = start.row;
    const startCol = start.column;
    const endRow = end.row;
    const endCol = end.column;

    function traverse(cursor) {
      const node = cursor.currentNode;

      if (node && node.intersectsRange(startRow, startCol, endRow, endCol)) {
        changedNodes.push(node);
      }

      if (cursor.gotoFirstChild()) {
        do traverse(cursor);
        while (cursor.gotoNextSibling());
        cursor.gotoParent();
      }
    }

    traverse(cursor);
  }

  return changedNodes;
}


// Utility to hash chunk text using SHA-256
function getChunkHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// Convert AST nodes to chunk objects
function nodesToChunks(nodes, fileId, projectId) {
  return nodes.map((node, index) => {
    const nameNode = node.childForFieldName('name');
    const text = node.text;
    return {
      fileId,
      projectId,
      chunkIndex: index,
      startRow: node.startPosition.row,
      endRow: node.endPosition.row,
      type: node.type,
      name: nameNode ? nameNode.text : null,
      text,
      hash: getChunkHash(text),
    };
  });
}

/**
 * Incrementally embed changed chunks and update DB
 * @param {string} fileId
 * @param {string} projectId
 * @param {Array} changedNodes
 */
export async function updateASTChunkEmbeddings(fileId, projectId, changedNodes) {
  console.log(changedNodes)
  if (!changedNodes || changedNodes.length === 0) return;

  // 1. Convert nodes to chunks
  const chunks = nodesToChunks(changedNodes, fileId, projectId);

  // 2. Load existing chunk hashes for this file
  const { rows: existingChunks } = await query(
    `SELECT chunk_index, chunk_hash FROM projects.chunk_meta WHERE file_id = $1`,
    [fileId]
  );
  const hashMap = Object.fromEntries(existingChunks.map(c => [c.chunk_index, c.chunk_hash]));

  // 3. Only embed new/modified chunks
  const chunksToEmbed = chunks.filter(c => hashMap[c.chunkIndex] !== c.hash);
  if (chunksToEmbed.length === 0) return;

  // 4. Generate embeddings
  const embeddings = await OpenAIEmbeddingWrapper.embed(chunksToEmbed.map(c => c.text));

  // 5. Insert/update embeddings + chunk metadata
  for (let i = 0; i < chunksToEmbed.length; i++) {
    const chunk = chunksToEmbed[i];
    const embeddingVector = embeddings[i];

    // Insert embedding
    const { rows } = await query(
      `INSERT INTO projects.embeddings (vec) VALUES ($1::vector) RETURNING id`,
      [embeddingVector]
    );
    const embeddingId = rows[0].id;

    // Insert/update chunk metadata
    await query(
      `INSERT INTO projects.chunk_meta
        (file_id, chunk_index, start_index, end_index, chunk_hash, metadata, embedding_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (file_id, chunk_index) DO UPDATE
         SET chunk_hash = EXCLUDED.chunk_hash,
             embedding_id = EXCLUDED.embedding_id,
             metadata = EXCLUDED.metadata`,
      [
        chunk.fileId,
        chunk.chunkIndex,
        chunk.startRow,
        chunk.endRow,
        chunk.hash,
        JSON.stringify({ type: chunk.type, name: chunk.name }),
        embeddingId,
      ]
    );
  }

  console.log(`💾 Updated ${chunksToEmbed.length} chunks for file ${fileId}`);
}

/**
 * Fire-and-forget trigger for a file RAG pipeline
 * @param {string} fileId
 * @param {string} projectId
 * @param {string} content
 */
export async function triggerRAGPipelineForFile(fileId, projectId, content) {
  setImmediate(async () => {
    try {
      const fileResult = await query(
        `SELECT name, content_key FROM projects.project_node WHERE id = $1`,
        [fileId]
      );

      if (fileResult.rows.length === 0) return;

      const fileData = fileResult.rows[0];
      const fileNode = {
        id: fileId,
        project_id: projectId,
        content: content,
        name: fileData.name,
        content_key: fileData.content_key,
      };

      // Parse and extract changed nodes
      const session = fileSessions[fileId];
      const { changedRanges, tree } = updateAST(fileId, session?.text || "", content);
      const changedNodes = extractChangedNodes(tree, changedRanges);

      // Update embeddings incrementally
      await updateASTChunkEmbeddings(fileId, projectId, changedNodes);
    } catch (err) {
      console.error(`Error in RAG pipeline for file ${fileId}:`, err);
    }
  });
}
