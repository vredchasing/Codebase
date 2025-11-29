import { OpenAIEmbeddingWrapper } from "../models/openAI.js";
import { query } from "../../postgresdb.js";

/**
 * Production-grade RAG Retrieval Service
 * 
 * Features:
 * - Vector similarity search using pgvector
 * - Metadata filtering (project_id, file_id, etc.)
 * - Configurable top-k and similarity thresholds
 * - Error handling and logging
 * - Result ranking and formatting
 */

/**
 * Default retrieval options
 */
const DEFAULT_OPTIONS = {
  topK: 10,                    // Number of results to return
  similarityThreshold: 0.0,    // Minimum similarity score (0-1, lower = more permissive)
  projectId: null,            // Filter by project_id (optional)
  fileId: null,               // Filter by file_id (optional)
  metadataFilters: {},         // Additional metadata filters (e.g., { type: 'function' })
  useCosineSimilarity: false,  // Use cosine similarity instead of L2 distance
  includeScores: true,        // Include similarity scores in results
};

/**
 * Retrieve relevant chunks using vector similarity search
 * 
 * @param {string} queryText - The search query text
 * @param {Object} options - Retrieval options
 * @param {number} [options.topK=10] - Number of results to return
 * @param {number} [options.similarityThreshold=0.0] - Minimum similarity score (0-1)
 * @param {string|number|Array} [options.projectId] - Filter by project ID(s)
 * @param {string|number|Array} [options.fileId] - Filter by specific file ID(s)
 * @param {Object} [options.metadataFilters] - Additional metadata filters
 * @param {boolean} [options.useCosineSimilarity=false] - Use cosine similarity (slower but sometimes better)
 * @param {boolean} [options.includeScores=true] - Include similarity scores in results
 * @returns {Promise<Array>} Array of retrieved chunks with metadata and scores
 * 
 * @example
 * const results = await retrieveEmbeddings("how to authenticate users", {
 *   topK: 5,
 *   projectId: 123,
 *   similarityThreshold: 0.7
 * });
 */
export async function retrieveEmbeddings(queryText, options = {}) {
  if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
    throw new Error('Query text must be a non-empty string');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 1. Embed the query using the same model as stored embeddings
  const queryEmbedder = new OpenAIEmbeddingWrapper({
    apiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-ada-002" // Must match the model used for ingestion
    });

    const queryEmbeddings = await queryEmbedder.embed(queryText);
    
    if (!queryEmbeddings || queryEmbeddings.length === 0) {
      throw new Error('Failed to generate query embedding');
    }

    const queryVector = queryEmbeddings[0]; // Single query returns array with one embedding
    
    if (queryVector.length !== 1536) {
      throw new Error(`Expected embedding dimension 1536, got ${queryVector.length}`);
    }

    // 2. Build the vector similarity query
    // pgvector supports L2 distance (vector_l2_ops) and cosine distance (vector_cosine_ops)
    // Lower distance = more similar
    const vectorString = '[' + queryVector.join(',') + ']';
    
    // Build WHERE clause for metadata filtering
    const whereConditions = [];
    const queryParams = [vectorString];
    let paramIndex = 2; // $1 is the vector

    // Support both single projectId/fileId and arrays
    if (opts.projectId !== null && opts.projectId !== undefined) {
      if (Array.isArray(opts.projectId) && opts.projectId.length > 0) {
        // Multiple project IDs
        const placeholders = opts.projectId.map((_, i) => `$${paramIndex + i}`).join(',');
        whereConditions.push(`cm.metadata->>'project_id' IN (${placeholders})`);
        queryParams.push(...opts.projectId.map(id => id.toString()));
        paramIndex += opts.projectId.length;
      } else if (!Array.isArray(opts.projectId)) {
        // Single project ID
        whereConditions.push(`cm.metadata->>'project_id' = $${paramIndex}`);
        queryParams.push(opts.projectId.toString());
        paramIndex++;
      }
    }

    if (opts.fileId !== null && opts.fileId !== undefined) {
      if (Array.isArray(opts.fileId) && opts.fileId.length > 0) {
        // Multiple file IDs
        const placeholders = opts.fileId.map((_, i) => `$${paramIndex + i}`).join(',');
        whereConditions.push(`cm.file_id IN (${placeholders})`);
        queryParams.push(...opts.fileId.map(id => id.toString()));
        paramIndex += opts.fileId.length;
      } else if (!Array.isArray(opts.fileId)) {
        // Single file ID
        whereConditions.push(`cm.file_id = $${paramIndex}`);
        queryParams.push(opts.fileId.toString());
        paramIndex++;
      }
    }

    // Add metadata filters
    for (const [key, value] of Object.entries(opts.metadataFilters)) {
      whereConditions.push(`cm.metadata->>'${key}' = $${paramIndex}`);
      queryParams.push(value.toString());
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // 3. Perform vector similarity search
    // Using L2 distance (Euclidean) - lower is better
    // For cosine similarity, we'd use: 1 - (vec <=> $1::vector)
    let similarityQuery;
    if (opts.useCosineSimilarity) {
      // Cosine distance: 1 - cosine_similarity
      // We want higher similarity, so we order by (1 - distance) DESC
      similarityQuery = `
        SELECT 
          cm.id,
          cm.file_id,
          cm.chunk_index,
          cm.start_index,
          cm.end_index,
          cm.metadata,
          cm.embedding_id,
          (1 - (e.vec <=> $1::vector)) as similarity_score,
          e.vec <=> $1::vector as distance
        FROM projects.embeddings e
        INNER JOIN projects.chunk_meta cm ON e.id = cm.embedding_id
        ${whereClause}
        ORDER BY e.vec <=> $1::vector
        LIMIT $${paramIndex}
      `;
    } else {
      // L2 distance - lower is better (more similar)
      // Convert distance to similarity score: 1 / (1 + distance)
      similarityQuery = `
        SELECT 
          cm.id,
          cm.file_id,
          cm.chunk_index,
          cm.start_index,
          cm.end_index,
          cm.metadata,
          cm.embedding_id,
          (1 / (1 + (e.vec <-> $1::vector))) as similarity_score,
          e.vec <-> $1::vector as distance
        FROM projects.embeddings e
        INNER JOIN projects.chunk_meta cm ON e.id = cm.embedding_id
        ${whereClause}
        ORDER BY e.vec <-> $1::vector
        LIMIT $${paramIndex}
      `;
    }
    
    queryParams.push(opts.topK);
    
    const startTime = Date.now();
    const result = await query(similarityQuery, queryParams);
    const queryTime = Date.now() - startTime;

    // 4. Filter by similarity threshold and format results
    const chunks = result.rows
      .filter(row => row.similarity_score >= opts.similarityThreshold)
      .map(row => ({
        id: row.id,
        fileId: row.file_id,
        chunkIndex: row.chunk_index,
        startIndex: row.start_index,
        endIndex: row.end_index,
        metadata: typeof row.metadata === 'string' 
          ? JSON.parse(row.metadata) 
          : row.metadata,
        embeddingId: row.embedding_id,
        ...(opts.includeScores && {
          similarityScore: parseFloat(row.similarity_score),
          distance: parseFloat(row.distance)
        })
      }));

    console.log(`🔍 Retrieved ${chunks.length} chunks for query "${queryText.substring(0, 50)}..." (${queryTime}ms)`);

    return chunks;

  } catch (error) {
    console.error('❌ Error in retrieveEmbeddings:', error);
    throw new Error(`Retrieval failed: ${error.message}`);
  }
}

/**
 * Retrieve chunks and optionally fetch their full text content
 * Note: This requires fetching file content from storage, which can be slow for many chunks.
 * Consider using this only when you need the actual text content.
 * 
 * @param {string} queryText - The search query text
 * @param {Object} options - Retrieval options (same as retrieveEmbeddings)
 * @param {boolean} [options.includeContent=false] - Whether to fetch chunk text content
 * @returns {Promise<Array>} Array of chunks with optional content
 */
export async function retrieveEmbeddingsWithContent(queryText, options = {}) {
  const { includeContent = false, ...retrievalOptions } = options;
  
  const chunks = await retrieveEmbeddings(queryText, retrievalOptions);
  
  if (!includeContent || chunks.length === 0) {
    return chunks;
  }

  // Dynamically import to avoid circular dependencies
  const { fetchContentFromStorage } = await import('../../../src/services/getFilesForProject.js');

  // Fetch content for each unique file
  const fileIds = [...new Set(chunks.map(c => c.fileId))];
  const fileContentMap = new Map();

  for (const fileId of fileIds) {
    try {
      // Get content_key from project_node
      const fileResult = await query(
        `SELECT content_key FROM projects.project_node WHERE id = $1`,
        [fileId]
      );

      if (fileResult.rows.length > 0 && fileResult.rows[0].content_key) {
        const content = await fetchContentFromStorage(fileResult.rows[0].content_key);
        fileContentMap.set(fileId, content);
      }
    } catch (error) {
      console.error(`Failed to fetch content for file ${fileId}:`, error);
    }
  }

  // Enrich chunks with text content
  const enrichedChunks = chunks.map(chunk => {
    const fileContent = fileContentMap.get(chunk.fileId);
    if (!fileContent) {
      return { ...chunk, text: null };
    }

    // Extract chunk text using startRow/endRow from metadata
    // Note: start_index/end_index in DB correspond to startRow/endRow
    const startRow = chunk.metadata?.startRow ?? chunk.startIndex ?? 0;
    const endRow = chunk.metadata?.endRow ?? chunk.endIndex ?? 0;
    
    const lines = fileContent.split('\n');
    const chunkText = lines.slice(startRow, endRow + 1).join('\n');

    return {
      ...chunk,
      text: chunkText,
      startRow,
      endRow
    };
  });

  console.log(`📄 Enriched ${enrichedChunks.length} chunks with content`);
  
  return enrichedChunks;
}

/**
 * Batch retrieve embeddings for multiple queries
 * Useful for processing multiple questions at once
 * 
 * @param {string[]} queries - Array of query texts
 * @param {Object} options - Retrieval options (same as retrieveEmbeddings)
 * @returns {Promise<Array>} Array of results, one per query
 */
export async function batchRetrieveEmbeddings(queries, options = {}) {
  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error('Queries must be a non-empty array');
  }

  const results = await Promise.all(
    queries.map(query => retrieveEmbeddings(query, options))
  );

  return results;
}
