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

// access functions for memoryCache

export function getMemoryCache (){
  return memoryCache;
}

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
  try{
    if (memoryCache.has(key)) memoryCache.delete(key);
    else if (memoryCache.size >= MAX_IN_MEMORY) {
      // Evict least-recently-used (first key)
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }
    memoryCache.set(key, value);
  }
  catch(err){
    console.error("Error in setMemory:", err);
  }
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

// Quick helper function to call tree-sitters parse to get a tree from text.

export async function getTree(content){
  const tree = parser.parse(content);
  return tree;
};

// ----------------------
// Public API
// 1) getTree(userId,projectId,fileId, oldContent, newContent)
//    -> returns { tree, text }
//    behavior: memory -> redis -> parse incoming content (and populate caches)
// 2) parseIncremental(userId,projectId,fileId, oldContent, newContent)
//    -> returns newTree and updates in-memory cache only (redis NOT updated)
// 3) setSnapshot(userId,projectId,fileId, newContent)
//    -> writes text snapshot to Redis (with TTL) and refreshes memory cache
// ----------------------

/**
 * Get AST tree for a file.
 * - If in-memory (LRU) hit -> return quickly
 * - Else if Redis has text -> parse(text) and populate memory
 * - Else parse provided oldContent and populate memory & (optionally) redis snapshot
 *
 * NOTE: caller should provide oldContent (from DB) so that on redis miss we can parse.
 */
export async function getTextCache(userId, projectId, fileId, oldContent) {
  const key = redisKeyFor(userId, projectId, fileId);

  // 1) memory
  const mem = getMemory(key);
  if (mem) {
    return {text: mem.text };
  }

  // 2) redis
  await redis.del(key)
  const raw = await redis.get(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const text = parsed.text;

      // store in-memory
      setMemory(key, {
        text,
        lastAccess: Date.now(),
        expireAt: Date.now() + CACHE_TTL
      });

      // refresh Redis TTL
      try { await redis.expire(key, AST_TTL); } catch (e) {/* ignore */ }

      return text;
    } catch (err) {
      // bad data in redis; fall through to parse from provided content
      console.warn(`astCache.getTree: failed parsing redis payload for ${key}`, err);
    }
  }

  //cache miss: parse provided oldContent, if oldContent is null, use empty string as this means
  //that the file is new and has no prior content
  const text = oldContent ?? "";
  console.log('logging text in getTextCache', text)

  // populate memory (but DO NOT force redis snapshot here; caller decides)
  setMemory(key, {
    text,
    lastAccess: Date.now(),
    expireAt: Date.now() + CACHE_TTL
  });

  return {text};
}

/**
 * Parse incrementally using Tree-sitter given an oldTree.
 * Updates only the in-memory cache (fast), does NOT write Redis.
 * Returns the new tree.
 */
export async function parseIncremental(userId, projectId, fileId, oldContent, newContent) {
  const key = redisKeyFor(userId, projectId, fileId);
  const newTree = parser.parse(newContent, oldContent);

  // update in-memory LRU !!!!!! THIS PROB SHOULD NOT BE HERE !!!!!
  setMemory(key, {
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
export async function setSnapshot(userId, projectId, fileId, newContent) {
  const key = redisKeyFor(userId, projectId, fileId);
  const payload = JSON.stringify({ text: newContent });

  // set with TTL (atomic)
  await redis.setEx(key, AST_TTL, payload);

  // also refresh in-memory entry if present (or create)
  try {
    const tree = parser.parse(newContent);
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
