const { WebSocketServer } = require('ws');

// Store the WebSocket server instance
let wss;

function initializeWebSocket(server) {
  // Create a new WebSocket server and attach it to the existing HTTP server
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('🔗 Client connected to WebSocket');
    ws.on('close', () => {
      console.log('🔌 Client disconnected from WebSocket');
    });
    ws.on('error', console.error);
  });

  console.log('✅ WebSocket server initialized');
}

/**
 * Broadcasts a message to all connected WebSocket clients.
 * @param {object} data - The data to send, will be stringified to JSON.
 */
function broadcast(data) {
  if (!wss) {
    console.warn('WebSocket server not initialized, cannot broadcast.');
    return;
  }

  const jsonData = JSON.stringify(data);
  wss.clients.forEach((client) => {
    // Check if the connection is still open before sending
    if (client.readyState === client.OPEN) {
      client.send(jsonData);
    }
  });
}

module.exports = { initializeWebSocket, broadcast };

