import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import redis from "../../../redis/redisClient.js";

const parser = new Parser();
parser.setLanguage(JavaScript);

// ----------------------
// Config
// ----------------------
export const AST_TTL = 24 * 60 * 60; // seconds (default 24h)
const CACHE_TTL = 5 * 60 * 1000; // ms (in-memory entry expires after 5m)
const MAX_IN_MEMORY = 100; // max in-memory entries (LRU)

// ----------------------
// In-memory LRU cache (Map-based)
// Map insertion order = access order if we re-insert on access
// ----------------------
const memoryCache = new Map();

/**
 * Promote key (touch) to most-recent
 */
function touch(key) {
  const v = memoryCache.get(key);
  if (!v) return;
  memoryCache.delete(key);
  memoryCache.set(key, v);
}

/**
 * Set memory cache entry; enforce MAX_IN_MEMORY (LRU eviction)
 * value: { tree, text, lastAccess, expireAt }
 */
function setMemory(key, value) {
  if (memoryCache.has(key)) memoryCache.delete(key);
  else if (memoryCache.size >= MAX_IN_MEMORY) {
    // Evict least-recently-used (first key)
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, value);
}

/**
 * Get memory cache entry; returns null if missing or expired
 */
function getMemory(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    memoryCache.delete(key);
    return null;
  }
  // refresh lastAccess & expireAt
  entry.lastAccess = Date.now();
  entry.expireAt = Date.now() + CACHE_TTL;
  touch(key);
  return entry;
}

// ----------------------
// Helper: build redis key
// ----------------------
function redisKeyFor(userId, projectId, fileId) {
  return `ast:${userId}:${projectId}:${fileId}`;
}

// ----------------------
// Public API
// 1) getTree(userId,projectId,fileId,fileContent)
//    -> returns { tree, text }
//    behavior: memory -> redis -> parse incoming content (and populate caches)
// 2) parseIncremental(userId,projectId,fileId, oldTree, newContent)
//    -> returns newTree and updates in-memory cache only (redis NOT updated)
// 3) setSnapshot(userId,projectId,fileId, content)
//    -> writes text snapshot to Redis (with TTL) and refreshes memory cache
// ----------------------

/**
 * Get AST tree for a file.
 * - If in-memory (LRU) hit -> return quickly
 * - Else if Redis has text -> parse(text) and populate memory
 * - Else parse provided fileContent and populate memory & (optionally) redis snapshot
 *
 * NOTE: caller should provide fileContent (from DB) so that on redis miss we can parse.
 */
export async function getTree(userId, projectId, fileId, fileContent) {
  const key = redisKeyFor(userId, projectId, fileId);

  // 1) memory
  const mem = getMemory(key);
  if (mem) {
    return { tree: mem.tree, text: mem.text };
  }

  // 2) redis
  const raw = await redis.get(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const text = parsed.text;
      const tree = parser.parse(text);

      // store in-memory
      setMemory(key, {
        tree,
        text,
        lastAccess: Date.now(),
        expireAt: Date.now() + CACHE_TTL
      });

      // refresh Redis TTL
      try { await redis.expire(key, AST_TTL); } catch (e) {/* ignore */ }

      return { tree, text };
    } catch (err) {
      // bad data in redis; fall through to parse from provided content
      console.warn(`astCache.getTree: failed parsing redis payload for ${key}`, err);
    }
  }

  // 3) cache miss: parse provided fileContent
  const text = fileContent ?? "";
  const tree = parser.parse(text);

  // populate memory (but DO NOT force redis snapshot here; caller decides)
  setMemory(key, {
    tree,
    text,
    lastAccess: Date.now(),
    expireAt: Date.now() + CACHE_TTL
  });

  return { tree, text };
}

/**
 * Parse incrementally using Tree-sitter given an oldTree.
 * Updates only the in-memory cache (fast), does NOT write Redis.
 * Returns the new tree.
 */
export async function parseIncremental(userId, projectId, fileId, oldTree, newContent) {
  const key = redisKeyFor(userId, projectId, fileId);
  const newTree = parser.parse(newContent, oldTree);

  // update in-memory LRU
  setMemory(key, {
    tree: newTree,
    text: newContent,
    lastAccess: Date.now(),
    expireAt: Date.now() + CACHE_TTL
  });

  return newTree;
}

/**
 * Persist text snapshot to Redis (with TTL) and refresh memory cache.
 * Use this after the embedding+db work completes successfully.
 */
export async function setSnapshot(userId, projectId, fileId, content) {
  const key = redisKeyFor(userId, projectId, fileId);
  const payload = JSON.stringify({ text: content });

  // set with TTL (atomic)
  await redis.setEx(key, AST_TTL, payload);

  // also refresh in-memory entry if present (or create)
  try {
    const tree = parser.parse(content);
    setMemory(key, {
      tree,
      text: content,
      lastAccess: Date.now(),
      expireAt: Date.now() + CACHE_TTL
    });
  } catch (err) {
    // If parsing fails unexpectedly, don't crash; still keep redis snapshot
    console.warn(`astCache.setSnapshot: parsing failed for ${key}`, err);
  }
}

/**
 * Optional helper: delete snapshot (project cleanup)
 */
export async function clearSnapshot(userId, projectId, fileId) {
  const key = redisKeyFor(userId, projectId, fileId);
  memoryCache.delete(key);
  await redis.del(key);
}
