const { JsonRpcProvider, Contract, getAddress, Wallet } = require("ethers");
require("dotenv").config();

const VotingContract = require("./Voting.json");
const abi = VotingContract.abi;

const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY; // ✅ using relayer key

let contract;
let provider;
let wallet;
let broadcastRef = null;

try {
  if (!CONTRACT_ADDRESS || !RELAYER_PRIVATE_KEY) {
    throw new Error("Missing CONTRACT_ADDRESS or RELAYER_PRIVATE_KEY in env");
  }

  provider = new JsonRpcProvider(RPC_URL);
  const address = getAddress(CONTRACT_ADDRESS);
  wallet = new Wallet(RELAYER_PRIVATE_KEY, provider);

  contract = new Contract(address, abi, wallet);
  console.log("✅ Contract loaded at:", address);

  // --- diagnostic ---
  if (typeof contract.candidateCounter === "function") {
    console.log("✅ candidateCounter() is available in ABI");
  } else {
    console.error("❌ candidateCounter() not found in ABI!");
    console.log("Functions detected:", Object.keys(contract.interface.functions));
  }
} catch (err) {
  console.error("❌ Failed to init contract:", err.message);
  process.exit(1);
}

// ✅ Wrapped read calls so you can import directly without struct getter confusion
async function getCandidateStruct(electionId, constituencyId, candidateId) {
  const eID = Number(electionId);
  const cID = Number(constituencyId);
  const candID = Number(candidateId);

  return retryBlockchainCall(() =>
    contract.candidates(eID, cID, candID)
  );
}

// ✅ Read total votes for an election
async function getElectionTotalVotes(electionId) {
  const eID = Number(electionId);
  return retryBlockchainCall(() =>
    contract.getTotalVotes(eID)
  );
}

// ✅ Read vote count for a specific candidate
async function getCandidateVoteCount(electionId, constituencyId, candidateId) {
  const eID = Number(electionId);
  const cID = Number(constituencyId);
  const candID = Number(candidateId);

  return retryBlockchainCall(() =>
    contract.getVoteCount(eID, cID, candID)
  );
}

// ✅ WebSocket vote listener (already fine)
function startVoteListener(broadcastFn) {
  broadcastRef = broadcastFn;

  contract.on("VoteCast", (electionId, voterHash, candidateId, event) => {
    console.log(`🗳 VoteCast detected → Election ${electionId}, Candidate ${candidateId}`);

    if (broadcastRef) {
      broadcastRef({
        type: "VOTE_UPDATE",
        payload: {
          electionId: Number(electionId),
          candidateId: Number(candidateId),
          timestamp: Date.now(),
        },
      });
      console.log(`📡 Broadcasted VOTE_UPDATE for Election ${electionId}`);
    }
  });

  console.log("👂 Listening for VoteCast events...");
}

// Exporting helpers ✅ so other files can import directly
module.exports = {
  contract,
  provider,
  startVoteListener,
  getCandidateStruct,
  getElectionTotalVotes,
  getCandidateVoteCount,
  getCandidateVoteCount,
  getElectionTotalVotes,
  
};
