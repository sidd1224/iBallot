const { JsonRpcProvider, Contract, getAddress, Wallet } = require("ethers");
require("dotenv").config();

const VotingContract = require("./Voting.json"); // Load the ABI file
const abi = VotingContract.abi;

const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
// Using ADMIN_PRIVATE_KEY as it's the one defined for the project
const ADMIN_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

let contract;
let provider;
let wallet;
let broadcastRef = null; // ✅ To store WebSocket broadcast function reference

try {
  if (!CONTRACT_ADDRESS || !ADMIN_PRIVATE_KEY) {
    throw new Error("Missing CONTRACT_ADDRESS or ADMIN_PRIVATE_KEY from environment variables.");
  }

  provider = new JsonRpcProvider(RPC_URL);
  // Validate and format contract address
  const address = getAddress(CONTRACT_ADDRESS); // throws if invalid
  wallet = new Wallet(ADMIN_PRIVATE_KEY, provider);

  contract = new Contract(address, abi, wallet);



  console.log("✅ Contract loaded at:", address);

  // --- Diagnostic check to confirm ABI is loaded properly ---
  if (typeof contract.candidateCounter === "function") {
    console.log("✅ candidateCounter function IS available on the contract object.");
  } else {
    console.error("❌ candidateCounter function IS NOT available on the contract object!");
    console.log("   Functions detected by ethers:", Object.keys(contract.interface.functions));
  }
  // -----------------------------------------------------------

} catch (err) {
  console.error("❌ Failed to initialize blockchain components:", err.message);
  process.exit(1);
}

/**
 * Starts listening for VoteCast events on the smart contract.
 * When an event is received, it broadcasts the data to connected clients (e.g., admin dashboards).
 * @param {function} broadcast - Function to call to broadcast messages over WebSocket.
 */
function startVoteListener(broadcast) {
  broadcastRef = broadcast; // Store broadcast reference

  contract.on("VoteCast", (electionId, constituencyId, candidateId, voterHash, event) => {
    console.log(`🗳️ VoteCast detected for Election ${electionId} -> Candidate ${candidateId}`);

    // 🔄 Broadcast to all connected WebSocket clients (admin dashboards)
    if (broadcastRef) {
      broadcastRef({
        type: "VOTE_UPDATE",
        payload: {
          electionId: Number(electionId),
          constituencyId: Number(constituencyId),
          candidateId: Number(candidateId),
          timestamp: Date.now(),
        },
      });
      console.log(`📡 Broadcasted VOTE_UPDATE for Election ${electionId}`);
    } else {
      console.warn("⚠️ No WebSocket broadcast reference found — skipping broadcast.");
    }
  });



  console.log("👂 Listening for VoteCast events...");
}

// Export everything that's needed by other parts of the app
module.exports = {
  contract,
  provider,
  startVoteListener,
};
