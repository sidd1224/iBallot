const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { JsonRpcProvider, Contract } = require("ethers");

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");

require("dotenv").config();

// Smart contract setup
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS; // Make sure this is in your .env file

const abi = ["function hasVoted(bytes32) view returns (bool)"];
const votingContract = new Contract(contractAddress, abi, provider);

/**
 * @route   POST /status
 * @desc    Checks if a voter has already cast their vote.
 * @access  Public (requires username)
 */
router.post("/", async (req, res) => {
  try {
    // Step 1: Get username from the request body.
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required." });
    }

    // Step 2: Fetch the user's encrypted data using their username.
    const result = await pool.query(
      "SELECT encrypted_blob FROM voter_metadata WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Voter not found." });
    }

    const { encrypted_blob } = result.rows[0];

    // Step 3: Decrypt the blob using the correct secret key.
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const decryptedString = decrypt(encrypted_blob, secretKey);
    const metadata = JSON.parse(decryptedString);

    const refId = metadata.reference_id;
    if (!refId) {
      throw new Error("Critical: Reference ID not found in decrypted data blob.");
    }

    // Step 4: Generate the voter hash from the reference ID.
    const voterHash = "0x" + generateVoterHash(refId, process.env.SECRET_SALT);

    // Step 5: Check the smart contract to see if the voter has already voted.
    const hasVoted = await votingContract.hasVoted(voterHash);

    res.status(200).json({ voterHash, hasVoted });

  } catch (err) {
    console.error("❌ Status check error:", err);
    res.status(500).json({ error: "Failed to check voter status", details: err.message });
  }
});

module.exports = router;
