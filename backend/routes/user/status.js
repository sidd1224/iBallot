const express = require("express");
const router = express.Router();
const { JsonRpcProvider, Contract } = require("ethers");

const pool = require("../../database/db");

require("dotenv").config();

// Smart contract setup
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS; // Make sure this is in your .env file

const abi = ["function hasVoted(bytes32) view returns (bool)"];
const votingContract = new Contract(contractAddress, abi, provider);

/**
 * @route   POST /status
 * @desc    Checks if a voter has already cast their vote using uid_hash.
 * @access  Public (requires username)
 */
router.post("/", async (req, res) => {
  let client;
  
  try {
    // Step 1: Get username from the request body.
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required." });
    }

    client = await pool.connect();

    // Step 2: Fetch the user's uid_hash using their username from new users table.
    const userResult = await client.query(
      "SELECT uid_hash FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Voter not found." });
    }

    const { uid_hash } = userResult.rows[0];

    // Step 3: Generate the voter hash from the uid_hash.
    const voterHash = "0x" + uid_hash;

    // Step 4: Check the smart contract to see if the voter has already voted.
    const hasVoted = await votingContract.hasVoted(voterHash);

    // Step 5: Get additional user info from ECI admin data
    const eciResult = await client.query(
      "SELECT ac_name, pc_name, ward_number, wallet_address FROM eci_admin_data WHERE uid_hash = $1",
      [uid_hash]
    );

    const eciData = eciResult.rows[0] || {};

    res.status(200).json({ 
      voterHash, 
      hasVoted,
      uidHash: uid_hash,
      constituency: {
        assembly: eciData.ac_name || 'Not assigned',
        parliament: eciData.pc_name || 'Not assigned',
        ward: eciData.ward_number || 'Not assigned'
      },
      walletAddress: eciData.wallet_address || 'Not assigned'
    });

  } catch (err) {
    console.error("❌ Status check error:", err);
    res.status(500).json({ error: "Failed to check voter status", details: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
