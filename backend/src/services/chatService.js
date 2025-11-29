import { query } from '../../postgresdb.js';

/**
 * Chat Service - Core Functions
 * Handles all database operations for chat sessions and messages
 */

/**
 * Create a new chat session
 * @param {string} userId - User ID (UUID)
 * @param {Object} options - Optional session metadata
 * @param {string} options.topic - Session topic/name
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<Object>} Created session object
 */
export async function createChatSession(userId, options = {}) {
  try {
    const { topic = null, metadata = null } = options;
    
    // Note: Assuming chat_sessions is in user_chats schema (based on chat_messages FK reference)
    // If schema doesn't exist, create it: CREATE SCHEMA IF NOT EXISTS user_chats;
    const result = await query(
      `INSERT INTO user_chats.chat_sessions (user_id, status, topic, metadata)
       VALUES ($1, 'active', $2, $3)
       RETURNING session_id, user_id, started_at, status, topic, metadata`,
      [userId, topic, metadata ? JSON.stringify(metadata) : null]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create chat session');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

/**
 * Save a chat message
 * @param {string} sessionId - Session ID (UUID)
 * @param {string} senderType - 'user' or 'assistant'
 * @param {string} content - Message content
 * @param {Object} options - Optional message metadata
 * @param {string} options.senderId - Sender ID (UUID, optional)
 * @param {string} options.modelRunId - Model run ID (UUID, optional)
 * @returns {Promise<Object>} Created message object
 */
export async function saveChatMessage(sessionId, senderType, content, options = {}) {
  try {
    const { senderId = null, modelRunId = null } = options;

    if (!['user', 'assistant'].includes(senderType)) {
      throw new Error('senderType must be "user" or "assistant"');
    }

    const result = await query(
      `INSERT INTO user_chats.chat_messages (session_id, sender_type, sender_id, content, model_run_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING message_id, session_id, sender_type, sender_id, content, created_at, model_run_id`,
      [sessionId, senderType, senderId, content, modelRunId]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to save chat message');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
}

/**
 * Get chat history for a session
 * @param {string} sessionId - Session ID (UUID)
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of messages to return
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.orderByNewest - Order by newest first (default: true)
 * @returns {Promise<Array>} Array of message objects
 */
export async function getChatHistory(sessionId, options = {}) {
  try {
    const { limit = null, offset = 0, orderByNewest = true } = options;

    let sql = `
      SELECT message_id, session_id, sender_type, sender_id, content, created_at, model_run_id
      FROM user_chats.chat_messages
      WHERE session_id = $1
      ORDER BY created_at ${orderByNewest ? 'DESC' : 'ASC'}
    `;

    const params = [sessionId];

    if (limit) {
      sql += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const result = await query(sql, params);

    // If ordered by newest first, reverse to get chronological order
    const messages = result.rows;
    if (orderByNewest) {
      messages.reverse();
    }

    return messages;
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    throw error;
  }
}

/**
 * Get all chat sessions for a user
 * @param {string} userId - User ID (UUID)
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status ('active', 'closed', null for all)
 * @param {number} options.limit - Maximum number of sessions to return
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Array>} Array of session objects
 */
export async function getUserChatSessions(userId, options = {}) {
  try {
    const { status = null, limit = null, offset = 0 } = options;

    let sql = `
      SELECT session_id, user_id, started_at, ended_at, status, topic, metadata
      FROM user_chats.chat_sessions
      WHERE user_id = $1
    `;

    const params = [userId];

    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY started_at DESC`;

    if (limit) {
      const limitParam = status ? 3 : 2;
      sql += ` LIMIT $${limitParam} OFFSET $${limitParam + 1}`;
      params.push(limit, offset);
    }

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error retrieving user chat sessions:', error);
    throw error;
  }
}

/**
 * Get a single chat session by ID
 * @param {string} sessionId - Session ID (UUID)
 * @returns {Promise<Object|null>} Session object or null if not found
 */
export async function getChatSession(sessionId) {
  try {
    const result = await query(
      `SELECT session_id, user_id, started_at, ended_at, status, topic, metadata
       FROM user_chats.chat_sessions
       WHERE session_id = $1`,
      [sessionId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error retrieving chat session:', error);
    throw error;
  }
}

/**
 * Close/end a chat session
 * @param {string} sessionId - Session ID (UUID)
 * @returns {Promise<Object>} Updated session object
 */
export async function closeChatSession(sessionId) {
  try {
    const result = await query(
      `UPDATE user_chats.chat_sessions
       SET status = 'closed', ended_at = NOW()
       WHERE session_id = $1
       RETURNING session_id, user_id, started_at, ended_at, status, topic, metadata`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found or already closed');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error closing chat session:', error);
    throw error;
  }
}

/**
 * Update session metadata
 * @param {string} sessionId - Session ID (UUID)
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object>} Updated session object
 */
export async function updateSessionMetadata(sessionId, metadata) {
  try {
    const result = await query(
      `UPDATE user_chats.chat_sessions
       SET metadata = $1
       WHERE session_id = $2
       RETURNING session_id, user_id, started_at, ended_at, status, topic, metadata`,
      [JSON.stringify(metadata), sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating session metadata:', error);
    throw error;
  }
}

/**
 * Get the last activity time for a session (last message timestamp)
 * @param {string} sessionId - Session ID (UUID)
 * @returns {Promise<Date|null>} Last activity timestamp or null
 */
export async function getSessionLastActivity(sessionId) {
  try {
    const result = await query(
      `SELECT MAX(created_at) as last_activity
       FROM user_chats.chat_messages
       WHERE session_id = $1`,
      [sessionId]
    );

    return result.rows[0]?.last_activity || null;
  } catch (error) {
    console.error('Error getting session last activity:', error);
    throw error;
  }
}

// ============================================================================
// FRAMEWORK FUNCTIONS FOR FUTURE OPTIMIZATIONS
// ============================================================================

/**
 * Delete old inactive chat sessions
 * Framework function for database optimization
 * 
 * @param {Object} options - Deletion options
 * @param {number} options.inactiveDays - Number of days of inactivity before deletion (default: 90)
 * @param {string} options.status - Only delete sessions with this status (default: 'closed')
 * @param {boolean} options.dryRun - If true, only return what would be deleted without actually deleting (default: false)
 * @returns {Promise<Object>} Deletion summary
 */
export async function deleteOldInactiveChats(options = {}) {
  try {
    const { inactiveDays = 90, status = 'closed', dryRun = false } = options;

    // First, get sessions that would be deleted
    const candidateResult = await query(
      `SELECT cs.session_id, cs.user_id, cs.started_at, cs.ended_at, cs.status,
              COALESCE(MAX(cm.created_at), cs.started_at) as last_activity
       FROM user_chats.chat_sessions cs
       LEFT JOIN user_chats.chat_messages cm ON cs.session_id = cm.session_id
       WHERE cs.status = $1
       GROUP BY cs.session_id, cs.user_id, cs.started_at, cs.ended_at, cs.status
       HAVING COALESCE(MAX(cm.created_at), cs.started_at) < NOW() - INTERVAL '${inactiveDays} days'`,
      [status]
    );

    const candidates = candidateResult.rows;

    if (dryRun) {
      return {
        dryRun: true,
        wouldDelete: candidates.length,
        sessions: candidates,
      };
    }

    if (candidates.length === 0) {
      return {
        deleted: 0,
        message: 'No inactive sessions found to delete',
      };
    }

    // Delete messages first (due to foreign key constraint)
    const sessionIds = candidates.map(s => s.session_id);
    const deleteMessagesResult = await query(
      `DELETE FROM user_chats.chat_messages
       WHERE session_id = ANY($1::uuid[])`,
      [sessionIds]
    );

    // Then delete sessions
    const deleteSessionsResult = await query(
      `DELETE FROM user_chats.chat_sessions
       WHERE session_id = ANY($1::uuid[])`,
      [sessionIds]
    );

    return {
      deleted: deleteSessionsResult.rowCount || 0,
      messagesDeleted: deleteMessagesResult.rowCount || 0,
      inactiveDays,
      status,
    };
  } catch (error) {
    console.error('Error deleting old inactive chats:', error);
    throw error;
  }
}

/**
 * Condense chat history to optimize token usage
 * Framework function for chat optimization
 * 
 * This function can be used to summarize older messages in a chat session
 * to reduce token usage while maintaining context.
 * 
 * @param {string} sessionId - Session ID (UUID)
 * @param {Object} options - Condensation options
 * @param {number} options.keepRecent - Number of recent messages to keep as-is (default: 10)
 * @param {number} options.maxMessages - Maximum number of messages to return (default: 50)
 * @param {Function} options.condenseFunction - Optional function to condense messages (for future LLM integration)
 * @returns {Promise<Object>} Condensed chat history with metadata
 */
export async function condenseChatHistory(sessionId, options = {}) {
  try {
    const { keepRecent = 10, maxMessages = 50, condenseFunction = null } = options;

    // Get all messages
    const allMessages = await getChatHistory(sessionId, { orderByNewest: false });

    if (allMessages.length <= maxMessages) {
      return {
        condensed: false,
        messageCount: allMessages.length,
        messages: allMessages,
      };
    }

    // Split into recent (keep as-is) and old (to condense)
    const recentMessages = allMessages.slice(-keepRecent);
    const oldMessages = allMessages.slice(0, allMessages.length - keepRecent);

    // If a condense function is provided, use it (for future LLM integration)
    let condensedSummary = null;
    if (condenseFunction && typeof condenseFunction === 'function') {
      try {
        condensedSummary = await condenseFunction(oldMessages);
      } catch (error) {
        console.error('Error in condense function:', error);
        // Fall back to simple truncation
      }
    }

    // For now, we'll just return a summary structure
    // In the future, you can integrate with an LLM to create actual summaries
    const result = {
      condensed: true,
      originalMessageCount: allMessages.length,
      keptRecent: recentMessages.length,
      condensedCount: oldMessages.length,
      messages: recentMessages,
      summary: condensedSummary || {
        type: 'placeholder',
        message: `${oldMessages.length} older messages condensed (LLM summarization not yet implemented)`,
        originalCount: oldMessages.length,
      },
    };

    return result;
  } catch (error) {
    console.error('Error condensing chat history:', error);
    throw error;
  }
}

/**
 * Get chat history formatted for LLM consumption
 * Converts database messages to the format expected by LLM APIs
 * 
 * @param {string} sessionId - Session ID (UUID)
 * @param {Object} options - Formatting options
 * @param {number} options.limit - Maximum number of messages (for token optimization)
 * @param {boolean} options.condense - Whether to condense old messages (default: false)
 * @returns {Promise<Array>} Array of messages in LLM format [{ role, content }]
 */
export async function getChatHistoryForLLM(sessionId, options = {}) {
  try {
    const { limit = null, condense = false } = options;

    let messages;
    if (condense) {
      const condensed = await condenseChatHistory(sessionId, { keepRecent: 10, maxMessages: limit || 50 });
      messages = condensed.messages;
      // If there's a summary, you could prepend it as a system message
      // For now, we'll just use the recent messages
    } else {
      messages = await getChatHistory(sessionId, { limit, orderByNewest: false });
    }

    // Convert to LLM format
    return messages.map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  } catch (error) {
    console.error('Error getting chat history for LLM:', error);
    throw error;
  }
}

/**
 * Get session statistics
 * Useful for monitoring and optimization decisions
 * 
 * @param {string} sessionId - Session ID (UUID)
 * @returns {Promise<Object>} Session statistics
 */
export async function getSessionStats(sessionId) {
  try {
    const session = await getChatSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const messageStats = await query(
      `SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE sender_type = 'user') as user_messages,
        COUNT(*) FILTER (WHERE sender_type = 'assistant') as assistant_messages,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message
       FROM user_chats.chat_messages
       WHERE session_id = $1`,
      [sessionId]
    );

    const stats = messageStats.rows[0];
    const lastActivity = await getSessionLastActivity(sessionId);

    return {
      sessionId,
      status: session.status,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      lastActivity,
      totalMessages: parseInt(stats.total_messages) || 0,
      userMessages: parseInt(stats.user_messages) || 0,
      assistantMessages: parseInt(stats.assistant_messages) || 0,
      firstMessage: stats.first_message,
      lastMessage: stats.last_message,
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    throw error;
  }
}

