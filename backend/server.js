// backend/server.js
const app = require("./app");
const http = require("http");
const { initializeWebSocket, broadcast } = require("./websocket");
const { startVoteListener } = require("./blockchain/contract");

// Create an HTTP server from the Express app

const server = http.createServer(app);

// Initialize the WebSocket server and attach it to the HTTP server
initializeWebSocket(server);

// Start listening for blockchain events and provide the broadcast function
startVoteListener(broadcast);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

