const { JsonRpcProvider, Contract, getAddress, Wallet } = require("ethers");
require("dotenv").config();

const VotingContract = require("./Voting.json");
const abi = VotingContract.abi;

const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY; 

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

  if (typeof contract.candidateCounter === "function") {
    console.log("✅ candidateCounter() is available in ABI");
  } else {
    console.error("❌ candidateCounter() not found in ABI!");
  }
} catch (err) {
  console.error("❌ Failed to init contract:", err.message);
  process.exit(1);
}

// ✅ Wrapped read calls
async function getCandidateStruct(electionId, constituencyId, candidateId) {
  const eID = Number(electionId);
  const cID = Number(constituencyId);
  const candID = Number(candidateId);

  return retryBlockchainCall(() =>
    contract.candidates(eID, cID, candID)
  );
}

async function getElectionTotalVotes(electionId) {
  const eID = Number(electionId);
  return retryBlockchainCall(() =>
    contract.getTotalVotes(eID)
  );
}

async function getCandidateVoteCount(electionId, constituencyId, candidateId) {
  const eID = Number(electionId);
  const cID = Number(constituencyId);
  const candID = Number(candidateId);

  return retryBlockchainCall(() =>
    contract.getVoteCount(eID, cID, candID)
  );
}

// ✅ WebSocket vote listener
function startVoteListener(broadcastFn) {
  broadcastRef = broadcastFn;

  // 👇 EVERYTHING MUST BE INSIDE THIS CALLBACK 👇
  contract.on("VoteCast", (electionId, voterHash, candidateId, event) => {
    console.log(`🗳 VoteCast detected → Election ${electionId}, Candidate ${candidateId}`);

    // ✅ EXTRACT TX HASH safely inside the event
    const txHash = event?.log?.transactionHash || event?.transactionHash;

    if (broadcastRef) {
      // 1. Send generic update for Admin Dashboard (Charts)
      broadcastRef({
        type: "VOTE_UPDATE",
        payload: {
          electionId: Number(electionId),
          candidateId: Number(candidateId),
          timestamp: Date.now(),
        },
      });

      // 2. Send specific confirmation for Voter (Receipt)
      broadcastRef({
        type: "VOTE_CONFIRMED", 
        payload: {
          electionId: Number(electionId),
          candidateId: Number(candidateId),
          voterHash: voterHash, 
          txHash: txHash,       
          timestamp: Date.now(),
        },
      });
      
      console.log(`📡 Broadcasted CONFIRMATION for Voter ${voterHash}`);
    }
  });
  // 👆 CALLBACK ENDS HERE 👆

  console.log("👂 Listening for VoteCast events...");
}

// Helper for retries (assumed to be imported or defined if used above, 
// otherwise ensure retryBlockchainCall is imported from utils if needed)
const { retryBlockchainCall } = require("../utils/blockchainUtils");

module.exports = {
  contract,
  provider,
  startVoteListener,
  getCandidateStruct,
  getElectionTotalVotes,
  getCandidateVoteCount,
};