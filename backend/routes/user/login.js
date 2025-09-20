const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { JsonRpcProvider, Contract } = require("ethers");

const pool = require("../../database/db");

require("dotenv").config();

// Smart contract setup for voting status check
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const abi = ["function hasVoted(bytes32) view returns (bool)"];
const votingContract = new Contract(contractAddress, abi, provider);

/**
 * @route   POST /login
 * @desc    Authenticates a user with username and password using new table structure.
 * @access  Public
 */
router.post("/", async (req, res) => {
  let client;
  
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    client = await pool.connect();

    // Step 1: Find the user by their username in the new users table
    const userResult = await client.query(
      "SELECT id, username, uid_hash, password, phone_number, full_name FROM users WHERE username = $1", 
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = userResult.rows[0];

    // Step 2: Compare the provided password with the stored bcrypt hash
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Step 3: Get ECI admin data for this user
    const eciResult = await client.query(
      "SELECT ac_name, pc_name, ward_number, wallet_address FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash]
    );

    if (eciResult.rows.length === 0) {
      return res.status(404).json({ error: "User data not found in ECI records." });
    }

    const eciData = eciResult.rows[0];

    // Step 4: Generate voter hash from UID hash
    const voterHash = "0x" + user.uid_hash;

    // Step 5: Check voting status from blockchain
    let hasVoted = false;
    try {
      hasVoted = await votingContract.hasVoted(voterHash);
    } catch (err) {
      console.warn("⚠️ Could not check voting status from blockchain:", err.message);
      // Continue with login even if status check fails
    }

    // Step 6: Update last login timestamp
    await client.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Step 7: Send success response with user, constituency data, and voting status
    res.status(200).json({
      message: "✅ Login successful",
      voterHash: voterHash,
      uidHash: user.uid_hash,
      hasVoted: hasVoted,
      user: {
        username: user.username,
        fullName: user.full_name,
        phoneNumber: user.phone_number
      },
      constituency: {
        assembly: eciData.ac_name,
        parliament: eciData.pc_name,
        ward: eciData.ward_number
      },
      walletAddress: eciData.wallet_address
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;

