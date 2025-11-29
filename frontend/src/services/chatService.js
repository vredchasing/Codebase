/**
 * Chat Service
 * Handles all chat-related API calls
 */

import { api, API_ENDPOINTS } from '../utils/apiClient';

/**
 * Create a new chat session
 * @param {Object} options - Session options
 * @param {string} options.topic - Session topic/name
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<Object>} Created session object
 */
export async function createChatSession(options = {}) {
  try {
    const response = await api.post(API_ENDPOINTS.CHAT.SESSIONS.CREATE, options);
    return response.data?.session || response.data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

/**
 * Get all chat sessions for the current user
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status ('active', 'closed', null for all)
 * @param {number} options.limit - Maximum number of sessions to return
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Array>} Array of session objects
 */
export async function getUserChatSessions(options = {}) {
  try {
    const { status, limit, offset } = options;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const url = `${API_ENDPOINTS.CHAT.SESSIONS.GET_ALL}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data?.sessions || [];
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
}

/**
 * Get a specific chat session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session object
 */
export async function getChatSession(sessionId) {
  try {
    const response = await api.get(API_ENDPOINTS.CHAT.SESSIONS.GET_ONE(sessionId));
    return response.data?.session || response.data;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    throw error;
  }
}

/**
 * Get chat history for a session
 * @param {string} sessionId - Session ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of messages to return
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.orderByNewest - Order by newest first (default: true)
 * @returns {Promise<Array>} Array of message objects
 */
export async function getChatHistory(sessionId, options = {}) {
  try {
    const { limit, offset, orderByNewest = true } = options;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    params.append('orderByNewest', orderByNewest.toString());

    const url = `${API_ENDPOINTS.CHAT.MESSAGES.GET(sessionId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data?.messages || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}

/**
 * Transform backend message format to frontend format
 * @param {Object} message - Backend message object
 * @returns {Object} Frontend message object
 */
export function transformMessageToComponent(message) {
  return {
    role: message.sender_type === 'user' ? 'user' : 'assistant',
    content: message.content,
    createdAt: message.created_at,
    messageId: message.message_id,
  };
}

export default {
  createChatSession,
  getUserChatSessions,
  getChatSession,
  getChatHistory,
  transformMessageToComponent,
};

