import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import redis from "../../../redis/redisClient.js";

const parser = new Parser();
parser.setLanguage(JavaScript);

// ----------------------
// Config
// ----------------------
export const AST_TTL = 24 * 60 * 60; // seconds (24h)
const CACHE_TTL = 5 * 60 * 1000; // ms (in-memory entry expires after 5m)
const MAX_IN_MEMORY = 100; // max in-memory entries (LRU)

// ----------------------
// In-memory LRU cache (Map-based)
// ----------------------
const memoryCache = new Map();
export function getMemoryCache() {
  return memoryCache;
}

// ----------------------
// Memory cache helpers
// ----------------------
function getMemory(key) {
  const now = Date.now();
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (now > entry.expireAt) {
    memoryCache.delete(key);
    return null;
  }

  // refresh access & move to most-recent
  entry.lastAccess = now;
  entry.expireAt = now + CACHE_TTL;

  memoryCache.delete(key);
  memoryCache.set(key, entry);

  return entry;
}

function setMemory(key, value) {
  const now = Date.now();

  value.lastAccess = now;
  value.expireAt = now + CACHE_TTL;

  if (memoryCache.has(key)) memoryCache.delete(key);
  else if (memoryCache.size >= MAX_IN_MEMORY) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }

  memoryCache.set(key, value);
}

// ----------------------
// Redis key helper
// ----------------------
function redisKeyFor(userId, projectId, fileId) {
  return `ast:${userId}:${projectId}:${fileId}`;
}

// ----------------------
// Tree-sitter parse helpers
// ----------------------
export async function getOldTree(content) {
  return parser.parse(content);
}

export async function getNewTree(oldTree, newContent) {
  return parser.parse(newContent, oldTree);
}

// ----------------------
// Public API
// ----------------------
/**
 * Returns both text and optionally cached chunk hashes
 */
export async function getTextCache(userId, projectId, fileId, oldContent) {
  const key = redisKeyFor(userId, projectId, fileId);

  // 1) Check in-memory cache
  const mem = getMemory(key);
  if (mem) return { text: mem.text, chunkHashes: mem.chunkHashes || {} };

  // 2) Check Redis
  const raw = await redis.get(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const text = parsed.text;
      const chunkHashes = parsed.chunkHashes || {};

      // populate memory cache
      setMemory(key, { text, chunkHashes });

      // refresh Redis TTL
      try { await redis.expire(key, AST_TTL); } catch (e) { /* ignore */ }

      return { text, chunkHashes };
    } catch (err) {
      console.warn(`astCache.getTextCache: failed parsing Redis payload for ${key}`, err);
    }
  }

  // 3) Fallback: use provided oldContent or empty string
  const text = oldContent ?? "";
  setMemory(key, { text, chunkHashes: {} });

  return { text, chunkHashes: {} };
}

/**
 * Updates snapshot and cached chunk hashes
 */
export async function setSnapshot(userId, projectId, fileId, newContent, chunkHashes = {}) {
  const key = redisKeyFor(userId, projectId, fileId);
  const payload = JSON.stringify({ text: newContent, chunkHashes });

  await redis.setEx(key, AST_TTL, payload);

  // refresh in-memory cache
  try {
    setMemory(key, { text: newContent, chunkHashes });
  } catch (err) {
    console.warn(`astCache.setSnapshot: failed for ${key}`, err);
  }
}

export async function clearSnapshot(userId, projectId, fileId) {
  const key = redisKeyFor(userId, projectId, fileId);
  memoryCache.delete(key);
  await redis.del(key);
}
