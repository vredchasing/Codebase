/**
 * Status Bar Message Types and Utilities
 * Type definitions and helper functions for status bar messages
 */

/**
 * WebSocket message types
 */
export const WS_MESSAGE_TYPES = {
  // System messages
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',

  // Subscription messages
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',

  // Status update messages
  STATUS_UPDATE: 'status_update',
};

/**
 * Connection states
 */
export const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
};

/**
 * Create a status update message
 * @param {Object} status - Status object
 * @returns {Object} Formatted message
 */
export function createStatusUpdate(status) {
  return {
    type: WS_MESSAGE_TYPES.STATUS_UPDATE,
    status,
    timestamp: Date.now(),
  };
}

/**
 * Create a subscription message
 * @param {string} projectId - Project ID
 * @returns {Object} Formatted message
 */
export function createSubscribeMessage(projectId) {
  return {
    type: WS_MESSAGE_TYPES.SUBSCRIBE,
    projectId,
    timestamp: Date.now(),
  };
}

/**
 * Create an unsubscribe message
 * @returns {Object} Formatted message
 */
export function createUnsubscribeMessage() {
  return {
    type: WS_MESSAGE_TYPES.UNSUBSCRIBE,
    timestamp: Date.now(),
  };
}

/**
 * Validate WebSocket message structure
 * @param {Object} message - Message to validate
 * @returns {boolean} Is valid
 */
export function isValidMessage(message) {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    message.type.length > 0
  );
}

/**
 * Format file path for display
 * @param {string} path - File path
 * @param {number} maxLength - Maximum display length
 * @returns {string} Formatted path
 */
export function formatFilePath(path, maxLength = 50) {
  if (!path) return '';
  if (path.length <= maxLength) return path;
  
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  
  // Show first part and last part with ellipsis
  return `${parts[0]}/.../${parts[parts.length - 1]}`;
}

/**
 * Format line/column info
 * @param {number} line - Line number
 * @param {number} column - Column number
 * @returns {string} Formatted string
 */
export function formatCursorPosition(line, column) {
  return `Ln ${line}, Col ${column}`;
}

/**
 * Get connection status color
 * @param {string} state - Connection state
 * @returns {string} Color code
 */
export function getConnectionColor(state) {
  const colors = {
    [CONNECTION_STATES.CONNECTED]: '#4ade80',
    [CONNECTION_STATES.CONNECTING]: '#fbbf24',
    [CONNECTION_STATES.DISCONNECTED]: '#9ca3af',
    [CONNECTION_STATES.ERROR]: '#ef4444',
  };
  return colors[state] || colors[CONNECTION_STATES.DISCONNECTED];
}



