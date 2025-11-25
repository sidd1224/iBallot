const { WebSocketServer } = require("ws");

let wss;

/**
 * Initializes the WebSocket server and attaches it to the existing HTTP server.
 * This listens on path `/ws` for compatibility with Nginx proxy and frontend.
 */
function initializeWebSocket(server) {
  // ✅ Add `path: "/ws"` so clients connect via /ws endpoint
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("🔗 Client connected to WebSocket");

    ws.on("close", () => {
      console.log("🔌 Client disconnected from WebSocket");
    });

    ws.on("error", (err) => {
      console.error("⚠️ WebSocket error:", err.message);
    });
  });

  console.log("✅ WebSocket server initialized on /ws");
}

/**
 * Broadcasts a JSON message to all connected WebSocket clients.
 * Used for pushing updates like live vote counts.
 */
function broadcast(data) {
  if (!wss) {
    console.warn("⚠️ WebSocket server not initialized, cannot broadcast.");
    return;
  }

  const jsonData = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(jsonData);
    }
  });
}

module.exports = { initializeWebSocket, broadcast };
