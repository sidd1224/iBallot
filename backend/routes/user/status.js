const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// --- CORRECT: Import the already configured contract instance ---
const votingContract = require("../../blockchain/contract");

require("dotenv").config();

/**
 * @route   POST /status
 * @desc    Checks if a voter has already cast their vote for the current active election.
 * @access  Public (requires username)
 */
router.post("/", async (req, res) => {
  let client;
  
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required." });
    }

    client = await pool.connect();

    // Step 1: Fetch the user's uid_hash
    const userResult = await client.query(
      "SELECT uid_hash FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Voter not found." });
    }

    const { uid_hash } = userResult.rows[0];
    const voterHash = "0x" + uid_hash;
    
    // Step 2: Check for an active election in the database
    const electionResult = await client.query(
        `SELECT election_id FROM elections 
         WHERE start_time <= NOW() AND end_time >= NOW() 
         ORDER BY start_time DESC LIMIT 1`
    );

    let hasVoted = false;
    let electionId = null;

    // Step 3: If an election is active, THEN check the blockchain
    if (electionResult.rows.length > 0) {
        electionId = electionResult.rows[0].election_id;
        try {
            // Call the contract with both required parameters
            hasVoted = await votingContract.hasVoted(electionId, voterHash);
        } catch (err) {
            console.warn("⚠️ Could not check voting status from blockchain:", err.message);
        }
    } else {
        console.log("✅ No active election found for status check. Reporting 'hasVoted' as false.");
    }

    // Step 4: Get additional user info from ECI admin data
    const eciResult = await client.query(
      "SELECT ac_name, pc_name, ward_number, wallet_address FROM eci_admin_data WHERE uid_hash = $1",
      [uid_hash]
    );

    const eciData = eciResult.rows[0] || {};

    res.status(200).json({ 
      voterHash, 
      hasVoted,
      electionId: electionId, // Include the active election ID in the response
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