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

  // ---!! ADD THIS DIAGNOSTIC CHECK !!---
  if (typeof contract.candidateCounter === 'function') {
      console.log("✅ candidateCounter function IS available on the contract object.");
  } else {
      console.error("❌ candidateCounter function IS NOT available on the contract object!");
      // Log the functions ethers actually sees based on the loaded ABI
      console.log("   Functions detected by ethers:", Object.keys(contract.interface.functions));
  }
  // ---!! END DIAGNOSTIC CHECK !!---


} catch (err) {
  console.error("❌ Failed to initialize blockchain components:", err.message);
  process.exit(1);
}


/**
 * Starts listening for VoteCast events on the smart contract.
 * When an event is received, it broadcasts the data to connected clients.
 * @param {function} broadcast - The function to call to broadcast messages.
 */
function startVoteListener(broadcast) {
  console.log("👂 Starting to listen for VoteCast events...");

  contract.on("VoteCast", (electionId, voterHash, candidateId, event) => {
    console.log(`🗳️  VoteCast Event Received:
        Election ID: ${electionId.toString()}
        Candidate ID: ${candidateId.toString()}
        Transaction: ${event.log.transactionHash}`);

    // When a vote comes in, we want to send the new vote counts to the frontend.
    // We create an object that the frontend can easily use to update the UI.
    const updateData = {
      type: 'VOTE_UPDATE',
      payload: {
        electionId: Number(electionId),
        candidateId: Number(candidateId),
      }
    };

    // Broadcast this update to all connected frontend clients
    broadcast(updateData);
  });

  // Removed the contract.on("error",...) listener as it caused issues previously
}

// Export everything that's needed by other parts of the app
module.exports = {
  contract,
  provider, // Export provider if needed elsewhere
  startVoteListener, // Export the listener function
};

