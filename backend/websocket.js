import { WebSocketServer } from "ws";

// Global websocket set with client metadata
const clients = new Map(); // Map<WebSocket, ClientInfo>

/**
 * @typedef {Object} ClientInfo
 * @property {string} id - Unique client identifier
 * @property {string} projectId - Current project ID (if any)
 * @property {number} connectedAt - Timestamp of connection
 * @property {number} lastPing - Last ping timestamp
 */

/**
 * Create and attach WebSocket server
 * @param {import('http').Server} httpServer - HTTP server instance
 * @returns {Object} WebSocket server utilities
 */
export function createWSServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    perMessageDeflate: false, // Disable compression for lower latency
  });

  // Heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [ws, clientInfo] of clients.entries()) {
      // Remove clients that haven't pinged in 60 seconds
      if (now - clientInfo.lastPing > 60000) {
        ws.terminate();
        clients.delete(ws);
      }
    }
  }, 30000); // Check every 30 seconds

  wss.on("connection", (ws, req) => {
    const clientId = generateClientId();
    const clientInfo = {
      id: clientId,
      projectId: null,
      connectedAt: Date.now(),
      lastPing: Date.now(),
    };

    clients.set(ws, clientInfo);

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: "connected",
      clientId,
      timestamp: Date.now()
    }));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
        // Send error response
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format",
          timestamp: Date.now()
        }));
      }
    });

    ws.on("close", (code, reason) => {
      clients.delete(ws);
      console.log(`Client ${clientId} disconnected. Code: ${code}, Reason: ${reason?.toString() || 'none'}`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(ws);
    });

    ws.on("pong", () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        clientInfo.lastPing = Date.now();
      }
    });

    console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);
  });

  // Cleanup on server shutdown
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  return {
    wss,
    broadcast,
    sendTo,
    sendToProject,
    getClientCount: () => clients.size,
    getClients: () => Array.from(clients.values()),
  };
}

/**
 * Generate unique client ID
 * @returns {string}
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send to all connected clients
 * @param {Object} payload - Message payload
 */
function broadcast(payload) {
  const msg = JSON.stringify({
    ...payload,
    timestamp: Date.now()
  });
  
  let sentCount = 0;
  for (const ws of clients.keys()) {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(msg);
        sentCount++;
      } catch (error) {
        console.error("Error broadcasting to client:", error);
      }
    }
  }
  
  return sentCount;
}

/**
 * Send to a specific client
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} payload - Message payload
 * @returns {boolean} Success status
 */
function sendTo(ws, payload) {
  if (ws && ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify({
        ...payload,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error("Error sending to client:", error);
      return false;
    }
  }
  return false;
}

/**
 * Send to all clients in a specific project
 * @param {string} projectId - Project ID
 * @param {Object} payload - Message payload
 * @returns {number} Number of clients notified
 */
function sendToProject(projectId, payload) {
  if (!projectId) return 0;
  
  const msg = JSON.stringify({
    ...payload,
    timestamp: Date.now()
  });
  
  let sentCount = 0;
  for (const [ws, clientInfo] of clients.entries()) {
    if (clientInfo.projectId === projectId && ws.readyState === ws.OPEN) {
      try {
        ws.send(msg);
        sentCount++;
      } catch (error) {
        console.error("Error sending to project client:", error);
      }
    }
  }
  
  return sentCount;
}

/**
 * Handle incoming client messages
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Parsed message data
 */
function handleClientMessage(ws, data) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) {
    ws.close(1008, "Client not found");
    return;
  }

  switch (data.type) {
    case "ping":
      // Update last ping time
      clientInfo.lastPing = Date.now();
      sendTo(ws, { type: "pong" });
      break;

    case "subscribe":
      // Subscribe to project updates
      if (data.projectId) {
        clientInfo.projectId = data.projectId;
        sendTo(ws, {
          type: "subscribed",
          projectId: data.projectId
        });
        console.log(`Client ${clientInfo.id} subscribed to project ${data.projectId}`);
      }
      break;

    case "unsubscribe":
      // Unsubscribe from project updates
      clientInfo.projectId = null;
      sendTo(ws, { type: "unsubscribed" });
      break;

    case "status_update":
      // Client is sending status update (e.g., cursor position, file change)
      // Broadcast to other clients in the same project
      if (clientInfo.projectId && data.status) {
        sendToProject(clientInfo.projectId, {
          type: "status_update",
          clientId: clientInfo.id,
          status: data.status
        });
      }
      break;

    default:
      console.warn(`Unknown message type: ${data.type}`);
      sendTo(ws, {
        type: "error",
        message: `Unknown message type: ${data.type}`
      });
  }
}
