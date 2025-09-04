const { JsonRpcProvider, Contract, getAddress, Wallet } = require("ethers");
require("dotenv").config();

const abi = require("./Voting.json").abi;
const provider = new JsonRpcProvider(process.env.RPC_URL);

let contract;

try {
  // Validate and format contract address
  const address = getAddress(process.env.CONTRACT_ADDRESS); // throws if invalid
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

  contract = new Contract(address, abi, wallet);

  console.log("✅ Contract loaded at:", address);
} catch (err) {
  console.error("❌ Invalid CONTRACT_ADDRESS or PRIVATE_KEY:", err.message);
  process.exit(1);
}

module.exports = contract;
