/**
 * WebSocket Server Instance
 * Singleton pattern to access wsServer from anywhere
 */

let wsServerInstance = null;

export function setWSServer(wsServer) {
  wsServerInstance = wsServer;
}

export function getWSServer() {
  return wsServerInstance;
}



