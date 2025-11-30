const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../../database/db");
const { contract } = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");
const jwt = require("jsonwebtoken");

require("dotenv").config();

/**
 * @route   POST /api/login
 * @desc    Authenticates a voter, checks on-chain authorization, and ensures they haven’t already voted.
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

    // ✅ Step 1: Fetch user + ECI info
    const userResult = await client.query(
      `SELECT
          u.id,
          u.username,
          u.uid_hash,
          u.password,
          e.wallet_address,
          e.ac_name,
          e.pc_name,
          e.ward_number,
          e.ac_id,
          e.pc_id
       FROM users u
       JOIN eci_admin_data e ON u.uid_hash = e.uid_hash
       WHERE u.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = userResult.rows[0];

    // ✅ Step 2: Validate password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // ✅ Step 3: Verify blockchain authorization
    const voterHash = "0x" + user.uid_hash;
    const dbWalletAddress = user.wallet_address;
    let contractWalletAddress;

    try {
      contractWalletAddress = await retryBlockchainCall(() => contract.isAuthorized(voterHash));
    } catch (err) {
      console.error("❌ Blockchain error checking authorization:", err.message);
      return res.status(500).json({ error: "Could not verify voter authorization. Please try again later." });
    }

    if (contractWalletAddress.toLowerCase() !== dbWalletAddress.toLowerCase()) {
      console.warn(`⚠️ Mismatch: DB=${dbWalletAddress} | Chain=${contractWalletAddress} for ${voterHash}`);
      return res.status(403).json({ error: "Voter authorization mismatch. Please contact support." });
    }

    // ✅ Step 4: Check if active election exists
    const electionResult = await client.query(
      `SELECT election_id FROM elections
       WHERE start_time <= NOW() AND end_time >= NOW()
       ORDER BY start_time DESC LIMIT 1`
    );

    let hasVoted = false;
    let electionId = null;

    if (electionResult.rows.length > 0) {
      electionId = electionResult.rows[0].election_id;
    }

    // ✅ Step 5: Block re-login if already voted
    if (hasVoted) {
      return res.status(403).json({ error: "You have already voted in this election." });
    }

    // ✅ Step 6: Generate token
    const payload = { username: user.username, uidHash: user.uid_hash };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "6h" }); // increased for stability

    // ✅ Step 7: Update last login timestamp
    await client.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);

    // ✅ Step 8: Respond with structured object
    res.status(200).json({
      message: "✅ Login successful",
      voterHash,
      uidHash: user.uid_hash,
      hasVoted,
      token,
      electionId,
      user: {
        username: user.username,
        hasVoted, // <-- now embedded properly
      },
      constituency: {
        assembly: user.ac_name,
        parliament: user.pc_name,
        ward: user.ward_number,
        ac_id: user.ac_id,
        pc_id: user.pc_id,
      },
      walletAddress: user.wallet_address,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
