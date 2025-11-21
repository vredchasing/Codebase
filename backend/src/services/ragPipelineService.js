import { parseFile, parseFileTree } from '../../engine/ingestion/parser.js';
import { embedChunksForFile, embedChunksForFileTree } from '../../engine/ingestion/embedding/embedder.js';
import { buildFileTreeWithContent } from './getFilesForProject.js';
import { query } from '../../postgresdb.js';

/**
 * Process a single file through the RAG pipeline (parse + embed)
 * This is called incrementally when a file is updated
 * 
 * @param {Object} fileNode - File node with content: { id, name, content, project_id, content_key, ... }
 * @returns {Promise<Array>} Array of processed chunks with embeddings
 */
export async function processFileForRAG(fileNode) {
  try {
    // 1. Parse the file to extract chunks
    const chunks = await parseFile(fileNode);
    
    if (chunks.length === 0) {
      console.log(`No chunks extracted from file: ${fileNode.name} (id: ${fileNode.id})`);
      return [];
    }

    // 2. Embed the chunks
    const embeddedChunks = await embedChunksForFile(fileNode);

    // 3. Store chunks and embeddings in database
    await storeChunksInDatabase(embeddedChunks, fileNode);

    console.log(`✅ RAG pipeline processed ${embeddedChunks.length} chunks for file: ${fileNode.name}`);
    return embeddedChunks;
  } catch (error) {
    console.error(`❌ Error processing file ${fileNode.name} for RAG:`, error);
    // Don't throw - we don't want RAG failures to break file saves
    return [];
  }
}

/**
 * Process an entire file tree through the RAG pipeline
 * Useful for initial project indexing or bulk processing
 * 
 * @param {Array} treeNodes - Array of tree nodes (files and folders)
 * @param {number} projectId - Project ID for metadata
 * @returns {Promise<Array>} Array of all processed chunks
 */
export async function processFileTreeForRAG(treeNodes, projectId) {
  try {
    // First, ensure we have content loaded for all files
    const treeWithContent = await buildFileTreeWithContent(treeNodes);
    
    // Process all files recursively
    const allChunks = await embedChunksForFileTree(treeWithContent, {
      project_id: projectId,
    });

    // Store all chunks in database
    for (const chunk of allChunks) {
      await storeChunksInDatabase([chunk], {
        id: chunk.file_id,
        name: chunk.file_name,
        project_id: chunk.project_id,
        content_key: chunk.content_key,
      });
    }

    console.log(`✅ RAG pipeline processed ${allChunks.length} total chunks for project ${projectId}`);
    return allChunks;
  } catch (error) {
    console.error(`❌ Error processing file tree for RAG:`, error);
    throw error;
  }
}

/**
 * Store chunks and embeddings in the database
 * Uses the existing chunk_meta and embeddings tables
 * 
 * @param {Array} embeddedChunks - Array of chunks with embeddings
 * @param {Object} fileNode - File node metadata
 */
async function storeChunksInDatabase(embeddedChunks, fileNode) {
  if (embeddedChunks.length === 0) return;

  try {
    // Delete existing chunks for this file (incremental update)
    await query(
      `DELETE FROM projects.chunk_meta WHERE file_id = $1`,
      [fileNode.id.toString()]
    );

    // Insert new chunks and embeddings
    for (let i = 0; i < embeddedChunks.length; i++) {
      const chunk = embeddedChunks[i];
      
      // 1. Insert embedding first
      // pgvector expects array format as string: '[1,2,3]'
      const vectorString = '[' + chunk.embedding.join(',') + ']';
      const embeddingResult = await query(
        `INSERT INTO projects.embeddings (vec) 
         VALUES ($1::vector) 
         RETURNING id`,
        [vectorString]
      );
      const embeddingId = embeddingResult.rows[0].id;

      // 2. Calculate chunk hash for change detection
      const chunkHash = calculateChunkHash(chunk.text);

      // 3. Insert chunk metadata with reference to embedding
      await query(
        `INSERT INTO projects.chunk_meta 
         (file_id, chunk_index, start_index, end_index, chunk_hash, metadata, embedding_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          fileNode.id.toString(),
          i,
          chunk.startRow || 0,
          chunk.endRow || 0,
          chunkHash,
          JSON.stringify({
            project_id: fileNode.project_id,
            file_name: fileNode.name,
            content_key: fileNode.content_key,
            type: chunk.type,
            name: chunk.name,
            ...chunk.meta,
          }),
          embeddingId,
        ]
      );
    }

    console.log(`💾 Stored ${embeddedChunks.length} chunks in database for file: ${fileNode.name}`);
  } catch (error) {
    console.error('Error storing chunks in database:', error);
    throw error;
  }
}

/**
 * Calculate a simple hash for chunk change detection
 * @param {string} text - Chunk text
 * @returns {string} Hash string
 */
function calculateChunkHash(text) {
  // Simple hash function - you could use crypto.createHash for production
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Trigger RAG pipeline for a file update (fire and forget)
 * This is called after a file is successfully updated
 * 
 * @param {number} fileId - File ID
 * @param {number} projectId - Project ID
 * @param {string} content - File content
 */
export async function triggerRAGPipelineForFile(fileId, projectId, content) {
  // Fire and forget - don't block file save
  setImmediate(async () => {
    try {
      // Build a minimal file node structure with content
      const fileNode = {
        id: fileId,
        project_id: projectId,
        content: content,
        // We'll need to fetch name and content_key from DB
      };

      // Fetch file metadata
      const fileResult = await query(
        `SELECT name, content_key FROM projects.project_node WHERE id = $1`,
        [fileId]
      );

      if (fileResult.rows.length === 0) {
        console.warn(`File ${fileId} not found for RAG processing`);
        return;
      }

      const fileData = fileResult.rows[0];
      fileNode.name = fileData.name;
      fileNode.content_key = fileData.content_key;

      // Process the file
      await processFileForRAG(fileNode);
    } catch (error) {
      console.error(`Error in RAG pipeline for file ${fileId}:`, error);
      // Silently fail - don't break file saves
    }
  });
}

