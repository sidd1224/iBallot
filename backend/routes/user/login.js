const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../../database/db");
const votingContract = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");
const jwt = require('jsonwebtoken');

require("dotenv").config();

/**
 * @route   POST /login
 * @desc    Authenticates a user and blocks login if they have already voted in an active election.
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

    // Step 1: Authenticate user credentials
    const userResult = await client.query(
      "SELECT id, username, uid_hash, password FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = userResult.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Step 2: Check for an active election in the database
    const electionResult = await client.query(
      `SELECT election_id FROM elections
       WHERE start_time <= NOW() AND end_time >= NOW()
       ORDER BY start_time DESC LIMIT 1`
    );

    let hasVoted = false;
    let electionId = null;
    const voterHash = "0x" + user.uid_hash;

    // Step 3: If an election is active, check the blockchain for voting status
    if (electionResult.rows.length > 0) {
      electionId = electionResult.rows[0].election_id;
      try {
        hasVoted = await retryBlockchainCall(() => votingContract.hasVoted(electionId, voterHash));
      } catch (err) {
        console.error("❌ Final attempt to check voting status failed:", err.message);
        // If the check fails, we should still deny login for safety during an active election.
        return res.status(500).json({ error: "Could not verify voting status. Please try again later." });
      }
    }

    // --- NEW: Block login if user has already voted ---
    if (hasVoted) {
      return res.status(403).json({ error: "You have already voted in the current election and cannot log in again." });
    }
    // --- END NEW LOGIC ---

    // If the user has NOT voted, proceed with the login process
    const eciResult = await client.query(
      "SELECT ac_name, pc_name, ward_number, wallet_address, ac_id, pc_id FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash]
    );
     if (eciResult.rows.length === 0) {
      return res.status(404).json({ error: "User data not found in ECI records." });
    }

    const eciData = eciResult.rows[0];

    await client.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );
    const payload = {
      username: user.username,
      uidHash: user.uid_hash,
    };

    // Sign the token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "✅ Login successful",
      voterHash: voterHash,
      uidHash: user.uid_hash,
      hasVoted: hasVoted,
      token,
      electionId: electionId,
      user: {
        username: user.username,
      },
      constituency: {
        assembly: eciData.ac_name,
        parliament: eciData.pc_name,
        ward: eciData.ward_number,
        ac_id: eciData.ac_id,
        pc_id: eciData.pc_id
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