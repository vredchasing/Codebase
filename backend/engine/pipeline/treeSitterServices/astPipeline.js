// merkleAstPipeline.js

import { query } from '../../../postgresdb.js';
import { getOldTree, getNewTree } from './astCache.js';
import crypto from 'crypto';
import { localModelClient } from '../../models/localModelClient.js';
import { diffLines } from 'diff'; 
import pLimit from 'p-limit';

/**
 * ============================
 * CONFIG & CONCURRENCY
 * ============================
 */
const LONG_NODE_CHAR_THRESHOLD = 4000;
const SLIDING_WINDOW_OVERLAP = 500;
const CONCURRENCY_LIMIT = 10;
const limit = pLimit(CONCURRENCY_LIMIT);

/**
 * ============================
 * UTILS
 * ============================
 */
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function isIndexableNode(node) {
  return node && typeof node.type === 'string' && node.type !== 'ERROR';
}

function normalizeCode(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

function createSlidingWindows(text, size, overlap) {
  const chunks = [];
  if (!text || text.length <= size) return [text || ''];

  let start = 0;
  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start += (size - overlap);
    if (start + (size / 4) > text.length) break; 
  }
  return chunks;
}

/**
 * ============================
 * 1. PURE MERKLE HASHING (Memoized / Zero Recompute)
 * ============================
 */
function computePureMerkleHash(rootNode, cache) {
  const stack = [rootNode];
  const postOrder = [];

  // Iterative Post-Order Traversal
  while (stack.length) {
    const node = stack.pop();
    postOrder.push(node);
    for (const child of node.namedChildren) {
      stack.push(child);
    }
  }

  for (let i = postOrder.length - 1; i >= 0; i--) {
    const node = postOrder[i];
    if (!isIndexableNode(node)) continue;

    //memoized
    if (cache.has(node)) continue;

    const baseText = normalizeCode(node.text || '');
    const childHashes = (node.namedChildren || [])
      .map(c => cache.get(c))
      .filter(Boolean);

    // Hash depends ONLY on type, content, and children. Path/File is ignored.
    const hash = sha256Hex(`${node.type}:${baseText}${childHashes.join('')}`);
    cache.set(node, hash);
  }

  return cache.get(rootNode);
}

/**
 * ============================
 * 2. COLLISION-RESISTANT STABLE IDS (Location)
 * ============================
 */
function computeStableId(node, getParent, fileId) {
  const parts = [];
  let cur = node;
  while (cur) {
    if (['class_declaration', 'function_declaration', 'method_definition', 'module'].includes(cur.type)) {
      const name = cur.childForFieldName?.('name')?.text || 'anon';
      // Sibling index prevents collisions for overloaded/unnamed methods
      const siblingIdx = cur.parent?.namedChildren.indexOf(cur) || 0;
      parts.push(`${cur.type}:${name}:${siblingIdx}`);
    }
    cur = getParent(cur);
  }
  return `${fileId}#${parts.reverse().join('#') || node.type}`;
}

/**
 * ============================
 * 3. CHUNK GENERATION
 * ============================
 */
async function nodeToChunks(node, fileId, getParent, merkleCache) {
  const stableId = computeStableId(node, getParent, fileId);
  const merkleHash = computePureMerkleHash(node, merkleCache);
  const chunks = [];

  const nameNode = node.childForFieldName?.('name');
  const sig = nameNode ? `${node.type} ${nameNode.text}` : node.type;
  const instanceId = `${stableId}@${node.startIndex}:${node.endIndex}`;

  // Signature Chunk
  chunks.push({
    fileId, stableId, instanceId,
    reprType: 'signature',
    text: sig,
    merkleHash,
    nodeType: node.type,
    chunkKey: `${instanceId}::signature`
  });

  // Body Chunking
  if (node.text.length <= LONG_NODE_CHAR_THRESHOLD) {
    chunks.push({
      fileId, stableId, instanceId,
      reprType: 'body',
      text: node.text,
      merkleHash,
      nodeType: node.type,
      chunkKey: `${instanceId}::body`
    });
  } else {
    const windows = createSlidingWindows(node.text, LONG_NODE_CHAR_THRESHOLD, SLIDING_WINDOW_OVERLAP);
    windows.forEach((winText, idx) => {
      // Determinstic sub-hash for windows
      const windowHash = sha256Hex(merkleHash + idx);
      chunks.push({
        fileId, stableId, instanceId,
        reprType: `body_part_${idx}`,
        text: winText,
        merkleHash: windowHash,
        nodeType: node.type,
        chunkKey: `${instanceId}::body::${idx}`
      });
    });
  }
  return chunks;
}

/**
 * ============================
 * 4. GLOBAL DEDUPLICATED UPDATE
 * ============================
 */
export async function updateEmbeddings(fileId, chunks) {
  if (!chunks.length) return;

  // A. Content Deduplication Check
  const uniqueHashes = [...new Set(chunks.map(c => c.merkleHash))];
  const { rows: existing } = await query(
    `SELECT merkle_hash FROM projects.nodes_content WHERE merkle_hash = ANY($1)`,
    [uniqueHashes]
  );
  const existingSet = new Set(existing.map(r => r.merkle_hash));

  // B. Embed only what is globally MISSING
  const newChunks = chunks.filter(c => !existingSet.has(c.merkleHash));
  
  if (newChunks.length > 0) {
    const vectors = await localModelClient.embedder.embed(newChunks.map(c => c.text));
    
    await query(`
      WITH ins_vec AS (
        INSERT INTO projects.embeddings (vec) SELECT UNNEST($1::vector[]) RETURNING id
      ),
      indexed_vec AS (SELECT id, row_number() OVER () as rn FROM ins_vec),
      indexed_cont AS (
        SELECT *, row_number() OVER () as rn 
        FROM UNNEST($2::text[], $3::text[], $4::text[]) AS t(m_hash, n_type, c_text)
      )
      INSERT INTO projects.nodes_content (merkle_hash, node_type, canonical_text, embedding_id)
      SELECT ic.m_hash, ic.n_type, ic.c_text, iv.id
      FROM indexed_cont ic JOIN indexed_vec iv ON ic.rn = iv.rn
      ON CONFLICT (merkle_hash) DO NOTHING`,
      [vectors.map(v => `[${v.join(',')}]`), newChunks.map(c => c.merkleHash), newChunks.map(c => c.nodeType), newChunks.map(c => c.text)]
    );
  }

  // C. Map File Locations to Content
  await query(`
    INSERT INTO projects.file_nodes (file_id, stable_id, chunk_key, repr_type, merkle_hash)
    SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[], $4::text[], $5::text[])
    ON CONFLICT (file_id, chunk_key) DO UPDATE SET merkle_hash = EXCLUDED.merkle_hash`,
    [
      chunks.map(c => fileId),
      chunks.map(c => c.stableId),
      chunks.map(c => c.chunkKey),
      chunks.map(c => c.reprType),
      chunks.map(c => c.merkleHash)
    ]
  );
}

/**
 * ============================
 * 5. MAIN PIPELINE
 * ============================
 */
export async function triggerRAGPipelineForFile(userId, fileId, projectId, oldContent, newContent) {
  setImmediate(async () => {
    try {
      // Line-level diffing for scalability
      const diffs = diffLines(oldContent || '', newContent);
      const changedRanges = [];
      let currentPos = 0;
      for (const part of diffs) {
        if (part.added) {
          changedRanges.push({ startIndex: currentPos, endIndex: currentPos + part.value.length });
          currentPos += part.value.length;
        } else if (!part.removed) {
          currentPos += part.value.length;
        }
      }

      if (!changedRanges.length) return;

      const newTree = await getNewTree(await getOldTree(oldContent), newContent);
      const { nodes, getParent } = extractChangedNodes(newTree, changedRanges);

      if (!nodes.length) return;

      // per-trigger Merkle cache (GC safe, zero recompute)
      const merkleCache = new WeakMap();

      // Parallelized chunking with concurrency control
      const chunkArrays = await Promise.all(
        nodes.map(node => limit(() => nodeToChunks(node, fileId, getParent, merkleCache)))
      );
      const allChunks = chunkArrays.flat();

      await updateEmbeddings(fileId, allChunks);

    } catch (err) {
      console.error(`[PIPELINE_ERROR] User ${userId}:`, err);
    }
  });
}
