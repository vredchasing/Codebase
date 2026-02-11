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
 * 1. UTILS & HELPERS
 * ============================
 */
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
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

function isIndexableNode(node) {
  const type = node.type;
  const lang = node.tree.language.name;

  const indexableTypes = {
    javascript: ['function_declaration', 'method_definition', 'class_declaration', 'arrow_function'],
    typescript: ['function_declaration', 'method_definition', 'class_declaration', 'arrow_function', 'interface_declaration', 'enum_declaration'],
    python: ['function_definition', 'class_definition'],
    go: ['function_declaration', 'method_declaration', 'type_declaration'],
    java: ['method_declaration', 'class_declaration', 'interface_declaration'],
    rust: ['function_item', 'struct_item', 'enum_item', 'impl_item'],
    cpp: ['function_definition', 'class_specifier', 'struct_specifier']
  };

  const langTypes = indexableTypes[lang] || [];
  return langTypes.includes(type) || type.includes('function') || type.includes('class');
}

/**
 * ============================
 * 2. COORDINATE RECONCILIATION
 * ============================
 */
function calculateDiffRanges(oldContent, newContent) {
  const diffs = diffLines(oldContent || '', newContent);
  const added = [];
  const deleted = [];
  let oldPos = 0, newPos = 0;

  for (const part of diffs) {
    const len = part.value.length;
    if (part.added) {
      added.push({ startIndex: newPos, endIndex: newPos + len });
      newPos += len;
    } else if (part.removed) {
      deleted.push({ startIndex: oldPos, endIndex: oldPos + len });
      oldPos += len;
    } else {
      oldPos += len;
      newPos += len;
    }
  }
  return { added, deleted };
}

/**
 * ============================
 * 3. MERKLE HASHING (MOVE-SAFE)
 * ============================
 */
function computePureMerkleHash(rootNode, cache) {
  const stack = [rootNode];
  const postOrder = [];

  while (stack.length) {
    const node = stack.pop();
    postOrder.push(node);
    for (const child of node.namedChildren) stack.push(child);
  }

  for (let i = postOrder.length - 1; i >= 0; i--) {
    const node = postOrder[i];
    if (!isIndexableNode(node)) continue;
    if (cache.has(node)) continue;

    const baseText = normalizeCode(node.text || '');
    const childHashes = (node.namedChildren || [])
      .map(c => cache.get(c))
      .filter(Boolean);

    // ✅ NO positional info included
    const hash = sha256Hex(`${node.type}:${baseText}:${childHashes.join('|')}`);
    cache.set(node, hash);
  }

  return cache.get(rootNode);
}

/**
 * ============================
 * 4. STABLE ID (COLLISION SAFE)
 * ============================
 */
function computeStableId(node, fileId) {
  const parts = [];
  let cur = node;

  while (cur) {
    if (['class_declaration', 'function_declaration', 'method_definition', 'module'].includes(cur.type)) {
      const rawName = cur.childForFieldName?.('name')?.text;
      const baseText = normalizeCode(cur.text || '');
      const fallbackHash = sha256Hex(baseText).slice(0, 8);
      const name = rawName || `anon_${fallbackHash}`;
      const siblingIdx = cur.parent?.namedChildren.indexOf(cur) || 0;

      parts.push(`${cur.type}:${name}:${siblingIdx}`);
    }
    cur = cur.parent;
  }

  return `${fileId}#${parts.reverse().join('#') || node.type}`;
}

/**
 * ============================
 * 5. SURGICAL DIRTY NODE PICK
 * ============================
 */
function getSurgicalNodes(newTree, addedRanges) {
  const nodes = [];
  const claimedRanges = [];

  function traverse(node) {
    for (const child of node.namedChildren) traverse(child);

    if (!isIndexableNode(node)) return;

    const hasChange = addedRanges.some(r =>
      node.startIndex < r.endIndex && node.endIndex > r.startIndex
    );

    if (hasChange) {
      const isCovered = claimedRanges.some(r =>
        r.start >= node.startIndex && r.end <= node.endIndex
      );

      if (!isCovered) {
        nodes.push(node);
        claimedRanges.push({ start: node.startIndex, end: node.endIndex });
      }
    }
  }

  traverse(newTree.rootNode);
  return nodes;
}

function getGhostIds(oldTree, deletedRanges, fileId) {
  const ghosts = new Set();
  if (!oldTree) return ghosts;

  function traverse(node) {
    if (isIndexableNode(node)) {
      const hit = deletedRanges.some(r =>
        node.startIndex < r.endIndex && node.endIndex > r.startIndex
      );
      if (hit) ghosts.add(computeStableId(node, fileId));
    }
    for (const child of node.namedChildren) traverse(child);
  }

  traverse(oldTree.rootNode);
  return ghosts;
}

/**
 * ============================
 * 6. CHUNKING
 * ============================
 */
async function nodeToChunks(node, fileId, merkleCache) {
  const stableId = computeStableId(node, fileId);
  const merkleHash = computePureMerkleHash(node, merkleCache);
  const chunks = [];

  const nameNode = node.childForFieldName?.('name');
  const contextHeader = `// Context: ${node.type} ${nameNode?.text || 'anon'}\n`;
  const instanceId = `${stableId}@${node.startIndex}:${node.endIndex}`;

  // Signature chunk
  chunks.push({
    fileId, stableId, instanceId,
    reprType: 'signature',
    text: contextHeader + (nameNode ? node.text.split('{')[0] : node.type),
    merkleHash,
    nodeType: node.type,
    chunkKey: `${instanceId}::signature`
  });

  // Body chunk(s)
  if (node.text.length <= LONG_NODE_CHAR_THRESHOLD) {
    chunks.push({
      fileId, stableId, instanceId,
      reprType: 'body',
      text: contextHeader + node.text,
      merkleHash,
      nodeType: node.type,
      chunkKey: `${instanceId}::body`
    });
  } else {
    const windows = createSlidingWindows(node.text, LONG_NODE_CHAR_THRESHOLD, SLIDING_WINDOW_OVERLAP);

    windows.forEach((winText, idx) => {
      // ✅ Window hash depends ONLY on window content (move-safe, change-isolated)
      const windowHash = sha256Hex(winText);

      chunks.push({
        fileId, stableId, instanceId,
        reprType: `body_part_${idx}`,
        text: contextHeader + winText,
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
 * 7. EMBEDDING UPDATE
 * ============================
 */
export async function updateEmbeddings(fileId, chunks) {
  if (!chunks.length) return;

  const uniqueHashes = [...new Set(chunks.map(c => c.merkleHash))];
  const { rows: existing } = await query(
    `SELECT merkle_hash FROM projects.nodes_content WHERE merkle_hash = ANY($1)`,
    [uniqueHashes]
  );
  const existingSet = new Set(existing.map(r => r.merkle_hash));

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
      ON CONFLICT (merkle_hash) DO NOTHING
    `,
      [vectors.map(v => `[${v.join(',')}]`), newChunks.map(c => c.merkleHash), newChunks.map(c => c.nodeType), newChunks.map(c => c.text)]
    );
  }

  await query(`
    INSERT INTO projects.file_nodes (file_id, stable_id, chunk_key, repr_type, merkle_hash)
    SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[], $4::text[], $5::text[])
    ON CONFLICT (file_id, chunk_key) DO UPDATE SET merkle_hash = EXCLUDED.merkle_hash
  `,
    [chunks.map(c => fileId), chunks.map(c => c.stableId), chunks.map(c => c.chunkKey), chunks.map(c => c.reprType), chunks.map(c => c.merkleHash)]
  );
}

/**
 * ============================
 * 8. MAIN ORCHESTRATION
 * ============================
 */
export async function triggerRAGPipelineForFile(userId, fileId, projectId, oldContent, newContent) {
  setImmediate(async () => {
    try {
      const { added, deleted } = calculateDiffRanges(oldContent, newContent);
      if (!added.length && !deleted.length) return;

      const oldTree = await getOldTree(oldContent);
      const newTree = await getNewTree(oldTree, newContent);
      const merkleCache = new WeakMap();

      const nodesToUpdate = getSurgicalNodes(newTree, added);
      const potentialGhosts = getGhostIds(oldTree, deleted, fileId);

      const chunkArrays = await Promise.all(
        nodesToUpdate.map(node => limit(() => nodeToChunks(node, fileId, merkleCache)))
      );
      const allChunks = chunkArrays.flat();

      if (allChunks.length > 0) await updateEmbeddings(fileId, allChunks);

      const activeIds = new Set(allChunks.map(c => c.stableId));
      const trueDeletions = [...potentialGhosts].filter(id => !activeIds.has(id));

      if (trueDeletions.length > 0) {
        await query(`
          DELETE FROM projects.file_nodes 
          WHERE file_id = $1 AND stable_id = ANY($2)
        `, [fileId, trueDeletions]);
      }

    } catch (err) {
      console.error(`[PIPELINE_ERROR] User ${userId}, File ${fileId}:`, err);
    }
  });
}
