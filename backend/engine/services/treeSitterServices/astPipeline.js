import { query } from '../../../postgresdb.js';
import { getTextCache, getOldTree, getNewTree, setSnapshot } from './astCache.js';
import { localAgentModel } from '../../models/localAgentModel.js';
import crypto from 'crypto';
import { localModelClient } from '../../models/localModelClient.js';
import { diffChars } from 'diff';

/**
 * Configuration
 */
const LONG_NODE_CHAR_THRESHOLD = 4000;
const SUMMARY_MAX_TOKENS = 150;

/**
 * ============================
 * 🔒 SAFETY: NODE VALIDATION
 * ============================
 */
function isIndexableNode(node) {
  return node && typeof node.type === 'string' && node.type !== 'ERROR';
}

/**
 * Helpers
 */
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * ============================
 * 🧠 TEXT DIFF → RANGE MAP
 * ============================
 */
function computeChangedRangesFromTextDiff(oldText, newText) {
  const diffs = diffChars(oldText, newText);
  const ranges = [];

  let newIndex = 0;

  for (const part of diffs) {
    if (part.added) {
      ranges.push({
        startIndex: newIndex,
        endIndex: newIndex + part.value.length
      });
      newIndex += part.value.length;
    } else if (part.removed) {
      // deletion affects surrounding structure
      ranges.push({
        startIndex: Math.max(newIndex - 1, 0),
        endIndex: newIndex
      });
    } else {
      newIndex += part.value.length;
    }
  }

  return ranges;
}

/**
 * ============================
 * STABLE IDS
 * ============================
 */
function computeStableId(node, getParent) {
  const parts = [];
  let cur = node;

  while (cur) {
    if (
      isIndexableNode(cur) &&
      ['class_declaration', 'function_declaration', 'method_definition', 'module'].includes(cur.type)
    ) {
      const nameNode = cur.childForFieldName?.('name');
      const name = nameNode?.text || '?';
      parts.push(`${cur.type}:${name}`);
    }
    cur = getParent(cur);
  }

  return parts.reverse().join('#') || `${node.type}:?`;
}

function computeInstanceId(stableId, node) {
  return `${stableId}@${node.startIndex}:${node.endIndex}`;
}

/**
 * ============================
 * REPRESENTATIONS
 * ============================
 */
function extractSignature(node) {
  if (!isIndexableNode(node)) return null;

  const nameNode = node.childForFieldName?.('name');
  let name = nameNode?.text || null;

  const paramsNode =
    node.childForFieldName?.('parameters') ||
    node.childForFieldName?.('parameter');

  let paramsText = paramsNode
    ? paramsNode.text.replace(/\s+/g, ' ').trim()
    : null;

  if (!paramsText) {
    const t = node.text.slice(0, 160);
    const m = t.match(/^(.*?)(\{|\=\>|$)/s);
    paramsText = m
      ? m[1].replace(/\s+/g, ' ').trim()
      : t.replace(/\s+/g, ' ').trim();
  }

  if (!name) {
    const snippet = node.text.slice(0, 30).replace(/\s+/g, ' ').trim();
    name = `anon_${sha256Hex(snippet).slice(0, 8)}`;
  }

  const sig = `${node.type} ${name} ${paramsText || ''}`.trim();
  if (sig.includes('ERROR')) return null;

  return sig;
}

function collectLeadingComments(node, getParent) {
  if (!isIndexableNode(node)) return [];

  const parent = getParent(node);
  if (!parent) return [];

  const comments = [];
  const siblings = parent.namedChildren || [];

  for (const sib of siblings) {
    if (sib === node) break;
    if (sib.type === 'comment' && sib.endIndex <= node.startIndex) {
      comments.push(sib.text);
    } else {
      comments.length = 0;
    }
  }

  return comments;
}

async function generateSummaryFromNode(node, getParent) {
  if (!isIndexableNode(node)) return null;

  const comments = collectLeadingComments(node, getParent);
  if (node.text.length < 200 && !comments.length) return null;

  const baseText = comments.length
    ? comments.join('\n')
    : node.text.slice(0, 800);

  try {
    return await localAgentModel.complete({
      system: 'You are a senior software engineer.',
      prompt: `Summarize the following code:\n\n${baseText}`,
      maxTokens: SUMMARY_MAX_TOKENS,
      temperature: 0.2
    });
  } catch {
    return baseText.replace(/\s+/g, ' ').trim();
  }
}

function determineReprTypes(node) {
  if (!isIndexableNode(node)) return [];
  const reprs = ['signature', 'summary'];
  if (node.text.length <= LONG_NODE_CHAR_THRESHOLD) reprs.push('body');
  return reprs;
}

async function nodeToRepresentationChunks(node, fileId, getParent) {
  if (!isIndexableNode(node)) return [];

  const stableId = computeStableId(node, getParent);
  const instanceId = computeInstanceId(stableId, node);
  const chunks = [];

  for (const repr of determineReprTypes(node)) {
    let text = null;
    if (repr === 'signature') text = extractSignature(node);
    if (repr === 'summary') text = await generateSummaryFromNode(node, getParent);
    if (repr === 'body') text = node.text;

    if (!text) continue;

    chunks.push({
      fileId,
      stableId,
      instanceId,
      reprType: repr,
      text,
      chunkKey: `${instanceId}::${repr}`,
      hash: sha256Hex(text),
      nodeType: node.type
    });
  }

  return chunks;
}

/**
 * ============================
 * AST CHANGE EXTRACTION
 * ============================
 */
export function extractChangedNodesAdvanced(tree, changedRanges, options = {}) {
  const semanticNodeTypes = options.semanticNodeTypes || new Set([
    'function_declaration',
    'class_declaration',
    'method_definition',
    'export_statement'
  ]);

  const changedNodes = new Map();
  const parentMap = new Map();
  const cursor = tree.walk();
  const parentStack = [];

  function intersects(node, start, end) {
    return node.startIndex < end && node.endIndex > start;
  }

  function walk(start, end) {
    const node = cursor.currentNode;
    if (!node) return;

    parentMap.set(node, parentStack.at(-1) || null);

    if (intersects(node, start, end) && isIndexableNode(node)) {
      if (semanticNodeTypes.has(node.type)) {
        changedNodes.set(node, node);
      } else {
        let cur = parentMap.get(node);
        while (cur) {
          if (semanticNodeTypes.has(cur.type)) {
            changedNodes.set(cur, cur);
            break;
          }
          cur = parentMap.get(cur);
        }
      }
    }

    if (cursor.gotoFirstChild()) {
      parentStack.push(node);
      do walk(start, end);
      while (cursor.gotoNextSibling());
      parentStack.pop();
      cursor.gotoParent();
    }
  }

  for (const r of changedRanges) {
    walk(r.startIndex, r.endIndex);
  }

  return { nodes: [...changedNodes.values()], getParent: n => parentMap.get(n) };
}

/**
 * ============================
 * UPDATE EMBEDDINGS (UNCHANGED)
 * ============================
 */
export async function updateASTChunkEmbeddings(fileId, changedNodes, getParent, chunkHashes, tree = null) {
  let allChunks = [];

  for (const node of changedNodes) {
    allChunks.push(...await nodeToRepresentationChunks(node, fileId, getParent));
  }

  if (!allChunks.length && tree) {
    for (const node of tree.rootNode.namedChildren || []) {
      allChunks.push(...await nodeToRepresentationChunks(node, fileId, getParent));
    }
  }

  const currentKeys = new Set(allChunks.map(c => c.chunkKey));
  const staleKeys = Object.keys(chunkHashes).filter(k => !currentKeys.has(k));

  if (staleKeys.length) {
    await query(
      `DELETE FROM projects.chunk_meta WHERE file_id=$1 AND chunk_key=ANY($2)`,
      [fileId, staleKeys]
    );
    staleKeys.forEach(k => delete chunkHashes[k]);
  }

  const toEmbed = allChunks.filter(c => chunkHashes[c.chunkKey] !== c.hash);
  if (!toEmbed.length) return;

  toEmbed.forEach(c => (chunkHashes[c.chunkKey] = c.hash));

  const vectors = await localModelClient.embedder.embed(toEmbed.map(c => c.text));

  for (let i = 0; i < toEmbed.length; i++) {
    const { rows } = await query(
      `INSERT INTO projects.embeddings(vec) VALUES ($1::vector) RETURNING id`,
      [`[${Array.from(vectors[i]).join(',')}]`]
    );

    await query(
      `INSERT INTO projects.chunk_meta
       (file_id, chunk_key, chunk_hash, stable_id, instance_id, repr_type, node_type, embedding_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (file_id, chunk_key)
       DO UPDATE SET chunk_hash=EXCLUDED.chunk_hash,
                     embedding_id=EXCLUDED.embedding_id`,
      [
        fileId,
        toEmbed[i].chunkKey,
        toEmbed[i].hash,
        toEmbed[i].stableId,
        toEmbed[i].instanceId,
        toEmbed[i].reprType,
        toEmbed[i].nodeType,
        rows[0].id
      ]
    );
  }
}

/**
 * ============================
 * MAIN TRIGGER (FIXED)
 * ============================
 */
export async function triggerRAGPipelineForFile(userId, fileId, projectId, oldContent, newContent, actionId = null, wsServer = null) {
  setImmediate(async () => {
    try {
      // Send pipeline started status
      if (wsServer && actionId && projectId) {
        wsServer.sendToProject(String(projectId), {
          type: 'pipeline_status',
          status: 'started',
          actionId,
          fileId,
        });
      }

      const { text: prevText, chunkHashes = {} } =
        await getTextCache(userId, projectId, fileId, oldContent);

      // ✅ TEXT DIFF, NOT TREE DIFF
      const changedRanges =
        computeChangedRangesFromTextDiff(prevText, newContent);

      if (!changedRanges.length) {
        await setSnapshot(userId, projectId, fileId, newContent, chunkHashes);
        
        // Send pipeline completed status (no changes needed)
        if (wsServer && actionId && projectId) {
          wsServer.sendToProject(String(projectId), {
            type: 'pipeline_status',
            status: 'completed',
            actionId,
            fileId,
          });
        }
        return;
      }

      const prevTree = await getOldTree(prevText);
      const newTree = await getNewTree(prevTree, newContent);

      const { nodes, getParent } = extractChangedNodesAdvanced(newTree, changedRanges);
      console.log('updating embeddings for', nodes.length, 'changed AST nodes');
      console.log('changedNodes:', nodes.map(n => n.text.slice(0, 60).replace(/\s+/g, ' ')));
      await updateASTChunkEmbeddings(
        fileId,
        nodes,
        getParent,
        chunkHashes,
        newTree
      );

      await setSnapshot(userId, projectId, fileId, newContent, chunkHashes);

      // Send pipeline completed status
      if (wsServer && actionId && projectId) {
        wsServer.sendToProject(String(projectId), {
          type: 'pipeline_status',
          status: 'completed',
          actionId,
          fileId,
        });
      }
    } catch (err) {
      console.error('triggerRAGPipelineForFile error:', err);
      
      // Send pipeline error status
      if (wsServer && actionId && projectId) {
        wsServer.sendToProject(String(projectId), {
          type: 'pipeline_status',
          status: 'error',
          actionId,
          fileId,
          error: err.message || 'Embedding pipeline failed',
          details: err.stack,
        });
      }
    }
  });
}
