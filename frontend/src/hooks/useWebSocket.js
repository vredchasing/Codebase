import { useEffect, useRef } from 'react';
import websocketService from '../services/websocketService';
import useStatusBarStore from '../stores/statusBarStore';

/**
 * React hook for WebSocket connection management
 * @param {string} projectId - Optional project ID to subscribe to
 * @param {Object} options - Connection options
 * @returns {Object} WebSocket service utilities
 */
export function useWebSocket(projectId = null, options = {}) {
  const projectIdRef = useRef(projectId);
  const connectionState = useStatusBarStore((state) => state.connections.websocket.state);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    // Get WebSocket URL from environment or config
    // Default to same host/port as API, but with ws:// protocol
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsUrl =
      options.url ||
      import.meta.env.VITE_WS_URL ||
      apiBaseUrl.replace(/^https?/, 'ws') + '/ws';

    // Connect on mount
    websocketService.connect(wsUrl, { projectId });

    // Subscribe to project if provided
    if (projectId) {
      websocketService.subscribe(projectId);
    }

    // Cleanup on unmount
    return () => {
      if (projectIdRef.current) {
        websocketService.unsubscribe();
      }
      // Don't disconnect on unmount - keep connection alive for app lifetime
      // websocketService.disconnect();
    };
  }, []); // Only run on mount

  // Update subscription when projectId changes
  useEffect(() => {
    if (projectId) {
      websocketService.subscribe(projectId);
    } else {
      websocketService.unsubscribe();
    }
  }, [projectId]);

  return {
    send: websocketService.send.bind(websocketService),
    sendStatusUpdate: websocketService.sendStatusUpdate.bind(websocketService),
    onMessage: websocketService.onMessage.bind(websocketService),
    isConnected: websocketService.isConnected(),
    connectionState,
    subscribe: websocketService.subscribe.bind(websocketService),
    unsubscribe: websocketService.unsubscribe.bind(websocketService),
  };
}

export default useWebSocket;

