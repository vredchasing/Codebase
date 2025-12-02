// ragPipeline.js
import { query } from '../../../postgresdb.js';
import { OpenAIEmbeddingWrapper } from "../../models/openAI.js";
import { getTree, parseIncremental, setSnapshot } from './astCache.js';
import crypto from 'crypto';

/**
 * Convert AST nodes to chunk objects
 */
export function getChunkHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * nodesToChunks(nodes, fileId, projectId)
 */
function nodesToChunks(nodes, fileId, projectId) {
  return nodes.map((node, index) => {
    const nameNode = node.childForFieldName && node.childForFieldName('name');
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
      hash: require('crypto').createHash('sha256').update(text).digest('hex'),
    };
  });
}

/**
 * extractChangedNodes - traverse tree and collect nodes intersecting changed ranges
 */
export function extractChangedNodes(tree, changedRanges) {
  const changedNodes = [];
  for (const r of changedRanges) {
    const cursor = tree.walk();
    const start = tree.rootNode.positionAt(r.startIndex);
    const end = tree.rootNode.positionAt(r.endIndex);

    const startRow = start.row, startCol = start.column, endRow = end.row, endCol = end.column;

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

/**
 * updateASTChunkEmbeddings
 * - converts changedNodes -> chunks
 * - checks DB chunk_meta hashes to skip unchanged chunks
 * - inserts embeddings into projects.embeddings and updates chunk_meta
 */
export async function updateASTChunkEmbeddings(fileId, projectId, changedNodes) {
  if (!changedNodes || changedNodes.length === 0) return;

  const chunks = nodesToChunks(changedNodes, fileId, projectId);

  const { rows: existingChunks } = await query(
    `SELECT chunk_index, chunk_hash FROM projects.chunk_meta WHERE file_id = $1`,
    [fileId]
  );
  const hashMap = Object.fromEntries(existingChunks.map(c => [c.chunk_index, c.chunk_hash]));

  const chunksToEmbed = chunks.filter(c => hashMap[c.chunkIndex] !== c.hash);
  if (chunksToEmbed.length === 0) return;

  const embeddings = await OpenAIEmbeddingWrapper.embed(chunksToEmbed.map(c => c.text));

  for (let i = 0; i < chunksToEmbed.length; i++) {
    const chunk = chunksToEmbed[i];
    const embeddingVector = embeddings[i];

    const { rows } = await query(
      `INSERT INTO projects.embeddings (vec) VALUES ($1::vector) RETURNING id`,
      [embeddingVector]
    );
    const embeddingId = rows[0].id;

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
}

/**
 * triggerRAGPipelineForFile
 * - public function other modules should call when a file changes
 * - signature: (userId, fileId, projectId, newContent, oldContent)
 *
 * Behavior:
 *  - get previous tree via getTree(...)   (memory -> redis -> parse oldContent)
 *  - do incremental parse: parseIncremental(...)
 *  - extract changed nodes
 *  - embed changed chunks & update DB
 *  - after success: setSnapshot(...)  (writes text to Redis with TTL)
 */
export async function triggerRAGPipelineForFile(userId, fileId, projectId, newContent, oldContent) {
  // fire-and-forget
  setImmediate(async () => {
    try {
      // 1) get previous tree (reconstructs from redis if available)
      const { tree: prevTree } = await getTree(userId, projectId, fileId, oldContent);

      // 2) incremental parse (updates in-memory cache ONLY)
      const newTree = await parseIncremental(userId, projectId, fileId, prevTree, newContent);

      // 3) changed ranges + nodes
      const changedRanges = newTree.getChangedRanges(prevTree);
      const changedNodes = extractChangedNodes(newTree, changedRanges);

      if (!changedNodes || changedNodes.length === 0) {
        return;
      }

      // 4) embeddings + DB updates
      await updateASTChunkEmbeddings(fileId, projectId, changedNodes);

      // 5) after success: persist the text snapshot to redis (with TTL)
      await setSnapshot(userId, projectId, fileId, newContent);
    } catch (err) {
      console.error('triggerRAGPipelineForFile error:', err);
    }
  });
}
