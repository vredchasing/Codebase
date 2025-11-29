import express from 'express';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import {
  createChatSession,
  saveChatMessage,
  getChatHistory,
  getUserChatSessions,
  getChatSession,
  closeChatSession,
  updateSessionMetadata,
  getChatHistoryForLLM,
  getSessionStats,
  deleteOldInactiveChats,
  condenseChatHistory,
} from '../../../services/chatService.js';

const router = express.Router();

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
router.post('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    const { topic, metadata } = req.body;

    const session = await createChatSession(userId, { topic, metadata });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create chat session',
    });
  }
});

/**
 * GET /api/chat/sessions
 * Get all chat sessions for the authenticated user
 */
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;

    const sessions = await getUserChatSessions(userId, {
      status: status || null,
      limit: limit ? parseInt(limit) : null,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('Error retrieving chat sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chat sessions',
    });
  }
});

/**
 * GET /api/chat/sessions/:sessionId
 * Get a specific chat session
 */
router.get('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await getChatSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Verify the session belongs to the user
    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error retrieving chat session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chat session',
    });
  }
});

/**
 * PATCH /api/chat/sessions/:sessionId
 * Update session metadata or close session
 */
router.patch('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { metadata, status } = req.body;

    // Verify session belongs to user
    const session = await getChatSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    let updatedSession;

    if (status === 'closed') {
      updatedSession = await closeChatSession(sessionId);
    } else if (metadata) {
      updatedSession = await updateSessionMetadata(sessionId, metadata);
    } else {
      return res.status(400).json({
        success: false,
        error: 'No valid update provided',
      });
    }

    res.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update chat session',
    });
  }
});

/**
 * POST /api/chat/sessions/:sessionId/messages
 * Save a chat message
 */
router.post('/sessions/:sessionId/messages', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { content, senderType = 'user', modelRunId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    // Verify session belongs to user
    const session = await getChatSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const message = await saveChatMessage(sessionId, senderType, content, {
      // Note: senderId is set to null because the database expects UUID but userId is an integer
      // The senderType already indicates whether this is from a user or assistant
      senderId: null,
      modelRunId,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save chat message',
    });
  }
});

/**
 * GET /api/chat/sessions/:sessionId/messages
 * Get chat history for a session
 */
router.get('/sessions/:sessionId/messages', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { limit, offset, orderByNewest } = req.query;

    // Verify session belongs to user
    const session = await getChatSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const messages = await getChatHistory(sessionId, {
      limit: limit ? parseInt(limit) : null,
      offset: offset ? parseInt(offset) : 0,
      orderByNewest: orderByNewest !== 'false',
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chat history',
    });
  }
});

/**
 * GET /api/chat/sessions/:sessionId/messages/llm
 * Get chat history formatted for LLM consumption
 */
router.get('/sessions/:sessionId/messages/llm', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { limit, condense } = req.query;

    // Verify session belongs to user
    const session = await getChatSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const messages = await getChatHistoryForLLM(sessionId, {
      limit: limit ? parseInt(limit) : null,
      condense: condense === 'true',
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error retrieving chat history for LLM:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chat history',
    });
  }
});

/**
 * GET /api/chat/sessions/:sessionId/stats
 * Get session statistics
 */
router.get('/sessions/:sessionId/stats', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session belongs to user
    const session = await getChatSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const stats = await getSessionStats(sessionId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error retrieving session stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve session stats',
    });
  }
});

// ============================================================================
// ADMIN/OPTIMIZATION ROUTES
// ============================================================================

/**
 * POST /api/chat/admin/delete-old-chats
 * Delete old inactive chat sessions (admin/optimization function)
 * Note: In production, you may want to add admin authentication
 */
router.post('/admin/delete-old-chats', verifyToken, async (req, res) => {
  try {
    const { inactiveDays = 90, status = 'closed', dryRun = false } = req.body;

    const result = await deleteOldInactiveChats({
      inactiveDays: parseInt(inactiveDays),
      status,
      dryRun: dryRun === true || dryRun === 'true',
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error deleting old chats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete old chats',
    });
  }
});

/**
 * GET /api/chat/sessions/:sessionId/condense
 * Get condensed chat history (for token optimization)
 */
router.get('/sessions/:sessionId/condense', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { keepRecent = 10, maxMessages = 50 } = req.query;

    // Verify session belongs to user
    const session = await getChatSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const condensed = await condenseChatHistory(sessionId, {
      keepRecent: parseInt(keepRecent),
      maxMessages: parseInt(maxMessages),
    });

    res.json({
      success: true,
      condensed,
    });
  } catch (error) {
    console.error('Error condensing chat history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to condense chat history',
    });
  }
});

export default router;
