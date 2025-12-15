// backend/server.js
const app = require("./app");
const http = require("http");
const { initializeWebSocket, broadcast } = require("./websocket");
const { startVoteListener } = require("./blockchain/contract");

// Create an HTTP server from the Express app

const server = http.createServer(app);
const { fork } = require("child_process");
const path = require("path");

console.log("🚀 Starting API Server...");

// Start the Worker in a child process
const workerPath = path.join(__dirname, "worker.js");
const worker = fork(workerPath);

console.log(`👷 Worker process started with PID: ${worker.pid}`);

// Handle Worker Errors
worker.on("error", (err) => {
  console.error("❌ Worker process failed:", err);
});

// Ensure Worker stops when Server stops (Ctrl+C)
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping Server and Worker...");
  worker.kill();
  process.exit();
});

// Initialize the WebSocket server and attach it to the HTTP server
initializeWebSocket(server);

// Start listening for blockchain events and provide the broadcast function
startVoteListener(broadcast);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

