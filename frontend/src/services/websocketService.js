/**
 * WebSocket Service
 * Production-grade WebSocket client with automatic reconnection,
 * heartbeat, and status bar integration
 */

import useStatusBarStore from '../stores/statusBarStore';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = Infinity; // Retry indefinitely
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.isManualClose = false;
    this.clientId = null;
    this.projectId = null;
    this.messageHandlers = new Map();
    this.pendingMessages = [];
    this.isConnecting = false;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} url - WebSocket server URL
   * @param {Object} options - Connection options
   */
  connect(url, options = {}) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.warn('WebSocket already connected or connecting');
      return;
    }

    this.url = url;
    this.isManualClose = false;
    this.isConnecting = true;

    try {
      const wsUrl = new URL(url, window.location.origin);
      if (options.projectId) {
        wsUrl.searchParams.set('projectId', options.projectId);
      }

      this.ws = new WebSocket(wsUrl.toString());

      this.ws.onopen = (event) => this.handleOpen(event);
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = (event) => this.handleClose(event);

      useStatusBarStore.getState().setConnectionState('connecting');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      useStatusBarStore.getState().setConnectionState('error', error.message);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen(event) {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    useStatusBarStore.getState().setConnectionState('websocket', 'connected');

    // Start heartbeat
    this.startHeartbeat();

    // Send pending messages
    this.flushPendingMessages();

    // Subscribe to project if set
    if (this.projectId) {
      this.subscribe(this.projectId);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle system messages
      switch (data.type) {
        case 'connected':
          this.clientId = data.clientId;
          console.log('WebSocket client ID:', this.clientId);
          break;

        case 'pong':
          // Heartbeat response
          break;

        case 'subscribed':
          console.log('Subscribed to project:', data.projectId);
          break;

        case 'unsubscribed':
          console.log('Unsubscribed from project');
          break;

        case 'error':
          console.error('WebSocket error from server:', data.message);
          useStatusBarStore
            .getState()
            .addError('error', data.message || 'Server error', 'WebSocket');
          break;

        case 'pipeline_status':
          // Handle embedding pipeline status updates
          this.handlePipelineStatus(data);
          break;

        case 'status_update':
          // Handle status updates from other clients
          this.handleStatusUpdate(data);
          break;

        default:
          // Call registered message handlers
          const handlers = this.messageHandlers.get(data.type);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(data);
              } catch (error) {
                console.error('Error in message handler:', error);
              }
            });
          }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle status updates from server
   */
  handleStatusUpdate(data) {
    if (data.status) {
      // Update status bar based on received status
      if (data.status.file) {
        useStatusBarStore.getState().setFileStatus(data.status.file);
      }
      if (data.status.cursor) {
        useStatusBarStore.getState().setCursorStatus(data.status.cursor);
      }
    }
  }

  /**
   * Handle pipeline status updates
   */
  handlePipelineStatus(data) {
    const store = useStatusBarStore.getState();
    
    // Clear optimistic timeout if it exists
    if (window.pipelineTimeouts && data.actionId) {
      const timeout = window.pipelineTimeouts[data.actionId];
      if (timeout) {
        clearTimeout(timeout);
        delete window.pipelineTimeouts[data.actionId];
      }
    }
    
    if (data.status === 'started') {
      store.setConnectionState('embeddingPipeline', 'connecting');
    } else if (data.status === 'completed') {
      store.setConnectionState('embeddingPipeline', 'connected');
      // Complete the action status if this matches current action
      if (data.actionId) {
        store.completeAction(true);
      }
    } else if (data.status === 'error') {
      store.setConnectionState('embeddingPipeline', 'error', data.error);
      store.addError('error', data.error || 'Embedding pipeline failed', 'Embedding Pipeline', data.details);
      // Complete the action status with error
      if (data.actionId) {
        store.completeAction(false, data.error || 'Embedding pipeline failed');
      }
    }
  }

  /**
   * Handle WebSocket errors
   */
  handleError(event) {
    console.error('WebSocket error:', event);
    useStatusBarStore.getState().setConnectionState('websocket', 'error', 'Connection error');
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log('WebSocket closed:', event.code, event.reason);
    this.isConnecting = false;
    this.stopHeartbeat();

    if (!this.isManualClose) {
      useStatusBarStore.getState().setConnectionState('websocket', 'disconnected');
      this.scheduleReconnect();
    } else {
      useStatusBarStore.getState().setConnectionState('websocket', 'disconnected');
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.isManualClose) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      useStatusBarStore
        .getState()
        .addNotification('Connection lost. Please refresh the page.', 'error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`
    );

    // Don't spam notifications for reconnection attempts

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualClose) {
        this.connect(this.url);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send message through WebSocket
   * @param {Object} data - Message data
   * @param {boolean} queueIfDisconnected - Queue message if disconnected
   */
  send(data, queueIfDisconnected = false) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      if (queueIfDisconnected) {
        this.pendingMessages.push(data);
      }
      return false;
    }
  }

  /**
   * Flush pending messages
   */
  flushPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.send(message);
    }
  }

  /**
   * Subscribe to project updates
   * @param {string} projectId - Project ID
   */
  subscribe(projectId) {
    this.projectId = projectId;
    this.send({ type: 'subscribe', projectId }, true);
  }

  /**
   * Unsubscribe from project updates
   */
  unsubscribe() {
    this.projectId = null;
    this.send({ type: 'unsubscribe' });
  }

  /**
   * Send status update to server
   * @param {Object} status - Status object
   */
  sendStatusUpdate(status) {
    this.send(
      {
        type: 'status_update',
        status,
      },
      false
    );
  }

  /**
   * Register message handler
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   * @returns {Function} Unregister function
   */
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.pendingMessages = [];
    useStatusBarStore.getState().setConnectionState('websocket', 'disconnected');
  }

  /**
   * Get connection state
   */
  getState() {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'disconnected';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'disconnected';
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;

