// ragPipeline_optionC.js
import { query } from '../../../postgresdb.js';
import { OpenAIEmbeddingWrapper } from "../../models/openAI.js";
import { getTextCache, getTree, parseIncremental, setSnapshot } from './astCache.js';
import crypto from 'crypto';

/**
 * Configuration
 */
const LONG_NODE_CHAR_THRESHOLD = 4000; // if node.text.length > this, we won't create a 'body' embedding
const SUMMARY_MAX_TOKENS = 512; // requested size for LLM summaries (informational)

/**
 * Helpers
 */
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * Compute stable semantic id for a node (type + name + ancestry).
 * This is the semantic identity used for grouping different embedding types.
 * It intentionally does NOT include position so the id survives moves.
 */
function computeStableId(node, getParent /* (n)=>parentNode or null */) {
  const parts = [];
  // climb ancestors (stop on root)
  let cur = node;
  while (cur) {
    if (["class_declaration", "function_declaration", "method_definition", "module"].includes(cur.type)) {
      const nameNode = cur.childForFieldName?.("name");
      const name = nameNode ? nameNode.text : "?";
      parts.push(`${cur.type}:${name}`);
    }
    cur = getParent(cur);
  }
  // parts currently from node -> root; reverse to root->node
  return parts.reverse().join("#") || `${node.type}:?`;
}

/**
 * Compute instance id for a node (guarantees uniqueness even for duplicate siblings).
 * Uses stableId + position suffix so two identical sibling nodes get distinct instanceIds.
 */
function computeInstanceId(stableId, node) {
  return `${stableId}@${node.startIndex}:${node.endIndex}`;
}

/**
 * Extract a concise signature string for a node:
 * - Prefer explicit signature pieces (name + params) if present via fields
 * - Fallback: take the first line up to `{` or `=>` for arrow functions
 */
function extractSignature(node) {
  const nameNode = node.childForFieldName?.("name");
  let name = nameNode ? nameNode.text : null;

  // try parameters field
  let paramsText = null;
  const paramsNode = node.childForFieldName?.("parameters") || node.childForFieldName?.("parameter");
  if (paramsNode) {
    paramsText = paramsNode.text.replace(/\s+/g, ' ').trim();
  } else {
    // fallback: take first ~120 chars and trim at { or => or newline
    const t = node.text.slice(0, 160);
    const m = t.match(/^(.*?)(\{|\=\>|$)/s);
    paramsText = m ? m[1].replace(/\s+/g, ' ').trim() : t.replace(/\s+/g, ' ').trim();
  }

  if (!name) {
    // if anonymous, use node type + snippet
    const snippet = node.text.slice(0, 30).replace(/\s+/g,' ').trim();
    name = `anon_${sha256Hex(snippet).slice(0,8)}`;
  }
  return `${node.type} ${name} ${paramsText ? paramsText : ''}`.trim();
}

/**
 * Generate a semantic summary for a (possibly large) node.
 * This expects your OpenAI wrapper to expose a summarization endpoint; if not present,
 * we fallback to a cheap heuristic: docstring/comments + first N chars.
 *
 * IMPORTANT: Replace/implement OpenAIEmbeddingWrapper.summarize if you have a specific wrapper.
 */
async function generateSummary(text) {
  // Prefer using the OpenAI wrapper's summarization if available
  if (typeof OpenAIEmbeddingWrapper.summarize === 'function') {
    try {
      // the wrapper should return a short text summary
      return await OpenAIEmbeddingWrapper.summarize(text, { max_tokens: SUMMARY_MAX_TOKENS });
    } catch (e) {
      console.warn('Summarization failed, falling back to heuristic summary:', e);
    }
  }

  // Fallback heuristic: extract top comment block or first 400 chars
  const commentMatch = text.match(/\/\*\*?([\s\S]{0,400}?)\*\/|\/\/([^\n]{0,200})/);
  if (commentMatch) {
    const match = commentMatch[1] || commentMatch[2];
    if (match && match.trim().length > 20) return match.trim().replace(/\s+/g, ' ').slice(0, 600);
  }
  // fallback: first 400 chars with whitespace collapse
  return text.slice(0, 400).replace(/\s+/g, ' ').trim();
}

/**
 * Compute per-representation (signature/summary/body) chunk objects for a node.
 * Returns an array of chunk descriptors:
 * {
 *   fileId, projectId,
 *   stableId, instanceId,
 *   reprType: 'signature'|'summary'|'body',
 *   text,
 *   chunkKey,   // string used as DB key: instanceId::reprType
 *   hash        // sha256(text)
 * }
 */
async function nodeToRepresentationChunks(node, fileId, projectId, getParent) {
  const stableId = computeStableId(node, getParent);
  const instanceId = computeInstanceId(stableId, node);

  // signature (always)
  const signatureText = extractSignature(node);
  const signatureKey = `${instanceId}::signature`;
  const signatureHash = sha256Hex(signatureText);

  // summary (always; may be generated via LLM)
  const summaryText = await generateSummary(node.text);
  const summaryKey = `${instanceId}::summary`;
  const summaryHash = sha256Hex(summaryText);

  const chunks = [
    {
      fileId, projectId,
      stableId, instanceId,
      reprType: 'signature',
      text: signatureText,
      chunkKey: signatureKey,
      hash: signatureHash,
      nodeType: node.type
    },
    {
      fileId, projectId,
      stableId, instanceId,
      reprType: 'summary',
      text: summaryText,
      chunkKey: summaryKey,
      hash: summaryHash,
      nodeType: node.type
    }
  ];

  // body: only if under threshold
  if (node.text && node.text.length > 0 && node.text.length <= LONG_NODE_CHAR_THRESHOLD) {
    const bodyText = node.text;
    const bodyKey = `${instanceId}::body`;
    const bodyHash = sha256Hex(bodyText);
    chunks.push({
      fileId, projectId,
      stableId, instanceId,
      reprType: 'body',
      text: bodyText,
      chunkKey: bodyKey,
      hash: bodyHash,
      nodeType: node.type
    });
  }

  return chunks;
}

/**
 * Extract changed nodes (same as prior but returns nodes + helper to get parent)
 *
 * Note:
 * - We need a getParent(node) function for computeStableId. Tree-sitter Node objects
 *   sometimes have .parent; if not, we build parent links while walking.
 */
export function extractChangedNodesAdvanced(tree, changedRanges, options = {}) {
  const {
    minNodeSize = 10,
    semanticNodeTypes = new Set([
      'function_declaration',
      'class_declaration',
      'method_definition',
      'export_statement',
      'comment',
    ])
  } = options;

  const changedNodes = new Map();
  const dirtyParents = new Map();

  // We'll record nodes we visit and build a parent map (node -> parentNode)
  const parentMap = new Map();

  const cursor = tree.walk();
  const parentStack = [];

  function intersects(node, start, end) {
    return node.startIndex < end && node.endIndex > start;
  }

  function markChanged(node) {
    const key = `${node.startIndex}:${node.endIndex}:${node.type}`;
    changedNodes.set(key, node);
  }

  function markDirty(node) {
    const key = `${node.startIndex}:${node.endIndex}:${node.type}`;
    dirtyParents.set(key, node);
  }

  function walk(start, end) {
    const node = cursor.currentNode();
    if (!node) return;

    // store parent mapping for stable-id computation later
    if (parentStack.length) parentMap.set(node, parentStack[parentStack.length - 1]);
    else parentMap.set(node, null);

    const hit = intersects(node, start, end);
    if (hit && semanticNodeTypes.has(node.type)) {
      const size = node.endIndex - node.startIndex;
      if (size >= minNodeSize) markChanged(node);
      else if (parentStack.length) markDirty(parentStack[parentStack.length - 1]);

      // propagate dirty upward
      for (const p of parentStack) markDirty(p);

      return; // skip children
    }

    if (cursor.gotoFirstChild()) {
      parentStack.push(node);
      do {
        walk(start, end);
      } while (cursor.gotoNextSibling());
      parentStack.pop();
      cursor.gotoParent();
    }
  }

  for (const r of changedRanges) {
    walk(r.startIndex, r.endIndex);
  }

  // produce array of unique nodes: changed + dirty
  const nodes = [...new Map([...changedNodes, ...dirtyParents]).values()];

  // helper to get parent for any node
  const getParent = (n) => parentMap.get(n) || null;

  return { nodes, getParent };
}

/**
 * Update embeddings for changed nodes and handle deletions.
 *
 * New approach:
 * - For each changed node, generate its representation chunks (signature, summary, body if applicable)
 * - Collect all new chunkKeys for this run
 * - Compare with DB chunk_keys for file:
 *    - delete chunk rows (and their embeddings) for keys missing from newKeys (stale)
 * - For remaining/new chunkKeys, compare text hash against DB chunk_hash and embed only changed ones
 * - Insert embeddings and upsert chunk_meta
 */
export async function updateASTChunkEmbeddings(fileId, projectId, changedNodes, getParent) {
  if (!changedNodes || changedNodes.length === 0) return;

  // 1) generate representation chunks for all changed nodes
  const allChunks = [];
  for (const node of changedNodes) {
    const chunks = await nodeToRepresentationChunks(node, fileId, projectId, getParent);
    for (const c of chunks) {
      // attach optional metadata for DB insertion
      allChunks.push({
        chunkKey: c.chunkKey,
        text: c.text,
        hash: c.hash,
        fileId: c.fileId,
        projectId: c.projectId,
        stableId: c.stableId,
        instanceId: c.instanceId,
        reprType: c.reprType,
        nodeType: c.nodeType,
      });
    }
  }

  // dedupe by chunkKey (keep last if duplicates)
  const chunksByKey = new Map();
  for (const c of allChunks) chunksByKey.set(c.chunkKey, c);
  const chunksList = Array.from(chunksByKey.values());

  // 2) fetch existing DB chunk keys for this file
  const { rows: dbRows } = await query(
    `SELECT chunk_key, chunk_hash, embedding_id FROM projects.chunk_meta WHERE file_id = $1`,
    [fileId]
  );
  const dbByKey = Object.fromEntries(dbRows.map(r => [r.chunk_key, r]));

  const dbKeys = new Set(dbRows.map(r => r.chunk_key));
  const newKeys = new Set(chunksList.map(c => c.chunkKey));

  // 3) compute deleted keys (present in DB but not in newKeys)
  const deletedKeys = [...dbKeys].filter(k => !newKeys.has(k));
  if (deletedKeys.length) {
    // delete chunk_meta rows and associated embeddings
    // Note: deleting embedding rows by embedding_id requires reading embedding_id first.
    for (const key of deletedKeys) {
      const row = dbByKey[key];
      if (row && row.embedding_id) {
        await query(`DELETE FROM projects.embeddings WHERE id = $1`, [row.embedding_id]);
      }
      await query(`DELETE FROM projects.chunk_meta WHERE file_id = $1 AND chunk_key = $2`, [fileId, key]);
    }
  }

  // 4) determine which chunks need re-embedding by comparing hashes
  const chunksToEmbed = chunksList.filter(c => {
    const dbRow = dbByKey[c.chunkKey];
    return !dbRow || dbRow.chunk_hash !== c.hash;
  });

  if (chunksToEmbed.length === 0) {
    // still update metadata for chunks that exist to refresh start/end if needed
    for (const c of chunksList) {
      if (dbByKey[c.chunkKey]) {
        // upsert metadata: note chunk_meta must have columns to hold stableId/instanceId/reprType/nodeType if desired
        await query(
          `INSERT INTO projects.chunk_meta
            (file_id, chunk_key, chunk_hash, metadata)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (file_id, chunk_key) DO UPDATE
             SET chunk_hash = EXCLUDED.chunk_hash,
                 metadata = EXCLUDED.metadata`,
          [c.fileId, c.chunkKey, c.hash, JSON.stringify({ stableId: c.stableId, instanceId: c.instanceId, reprType: c.reprType, nodeType: c.nodeType })]
        );
      } else {
        // insert small placeholder row without embedding (will be embedded next run if needed)
        await query(
          `INSERT INTO projects.chunk_meta
            (file_id, chunk_key, chunk_hash, metadata)
           VALUES ($1,$2,$3,$4)`,
          [c.fileId, c.chunkKey, c.hash, JSON.stringify({ stableId: c.stableId, instanceId: c.instanceId, reprType: c.reprType, nodeType: c.nodeType })]
        );
      }
    }
    return;
  }

  // 5) embed changed texts in batch
  const texts = chunksToEmbed.map(c => c.text);
  const embeddings = await OpenAIEmbeddingWrapper.embed(texts);

  // 6) store embeddings and upsert chunk_meta
  for (let i = 0; i < chunksToEmbed.length; i++) {
    const c = chunksToEmbed[i];
    const vec = embeddings[i];

    // insert vector
    const { rows: embRows } = await query(
      `INSERT INTO projects.embeddings (vec) VALUES ($1::vector) RETURNING id`,
      [vec]
    );
    const embeddingId = embRows[0].id;

    // upsert metadata linking to embedding
    await query(
      `INSERT INTO projects.chunk_meta
         (file_id, chunk_key, chunk_hash, metadata, embedding_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (file_id, chunk_key) DO UPDATE
         SET chunk_hash = EXCLUDED.chunk_hash,
             metadata = EXCLUDED.metadata,
             embedding_id = EXCLUDED.embedding_id`,
      [
        c.fileId,
        c.chunkKey,
        c.hash,
        JSON.stringify({ stableId: c.stableId, instanceId: c.instanceId, reprType: c.reprType, nodeType: c.nodeType }),
        embeddingId
      ]
    );
  }
}

/**
 * Main pipeline trigger
 */
export async function triggerRAGPipelineForFile(userId, fileId, projectId, oldContent, newContent) {
  // fire-and-forget
  setImmediate(async () => {
    try {
      // 1) get previous text
      const { text: prevText } = await getTextCache(userId, projectId, fileId, oldContent);
      const prevTree = await getTree(prevText);

      // 2) incremental parse -> new tree
      const newTree = await parseIncremental(userId, projectId, fileId, prevText, newContent);

      // 3) changed ranges (Tree-sitter)
      const changedRanges = newTree.getChangedRanges(prevTree);
      if (!changedRanges || changedRanges.length === 0) {
        // still persist snapshot
        await setSnapshot(userId, projectId, fileId, newContent);
        return;
      }

      // 4) extract changed nodes (and getParent map)
      const { nodes: changedNodes, getParent } = extractChangedNodesAdvanced(newTree, changedRanges);
      if (!changedNodes || changedNodes.length === 0) {
        await setSnapshot(userId, projectId, fileId, newContent);
        return;
      }

      // 5) update embeddings & metadata (includes deletion handling)
      await updateASTChunkEmbeddings(fileId, projectId, changedNodes, getParent);

      // 6) persist snapshot for next incremental parse
      await setSnapshot(userId, projectId, fileId, newContent);
    } catch (err) {
      console.error('triggerRAGPipelineForFile error:', err);
    }
  });
}
