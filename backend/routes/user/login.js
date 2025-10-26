const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../../database/db");
const { contract } = require("../../blockchain/contract"); // Import the contract instance
const { retryBlockchainCall } = require("../../utils/blockchainUtils");
const jwt = require('jsonwebtoken');

require("dotenv").config();

/**
 * @route   POST /login
 * @desc    Authenticates a user, verifies on-chain authorization, and blocks login if they have voted.
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

    // Step 1: Get all user data from DB with a single JOIN
    // This fetches the hashed password, uid_hash, and the wallet_address
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

    // Step 2: Authenticate user password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // --- NEW: Step 3: Verify user is authorized on-chain ---
    const voterHash = "0x" + user.uid_hash;
    const dbWalletAddress = user.wallet_address;
    let contractWalletAddress;

    try {
      contractWalletAddress = await retryBlockchainCall(() => contract.isAuthorized(voterHash));
    } catch (err) {
      console.error("❌ Blockchain error checking authorization:", err.message);
      return res.status(500).json({ error: "Could not verify voter authorization. Please try again later." });
    }

    // Check if the address from the contract matches the one in our database
    if (contractWalletAddress.toLowerCase() !== dbWalletAddress.toLowerCase()) {
      console.warn(`⚠️ Auth Mismatch: DB has ${dbWalletAddress} but Contract has ${contractWalletAddress} for ${voterHash}`);
      return res.status(403).json({ error: "Voter authorization mismatch. Please contact support or try re-registering." });
    }

    // --- END NEW LOGIC ---

    // Step 4: Check for an active election in the database
    const electionResult = await client.query(
      `SELECT election_id FROM elections
       WHERE start_time <= NOW() AND end_time >= NOW()
       ORDER BY start_time DESC LIMIT 1`
    );

    let hasVoted = false;
    let electionId = null;

    // Step 5: If an election is active, check the blockchain for voting status
    if (electionResult.rows.length > 0) {
      electionId = electionResult.rows[0].election_id;
      try {
        hasVoted = await retryBlockchainCall(() => contract.hasVoted(electionId, voterHash));
      } catch (err) {
        console.error("❌ Final attempt to check voting status failed:", err.message);
        return res.status(500).json({ error: "Could not verify voting status. Please try again later." });
      }
    }

    // Step 6: Block login if user has already voted
    if (hasVoted) {
      return res.status(403).json({ error: "You have already voted in the current election and cannot log in again." });
    }

    // Step 7: Proceed with successful login
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
        assembly: user.ac_name,
        parliament: user.pc_name,
        ward: user.ward_number,
        ac_id: user.ac_id,
        pc_id: user.pc_id
      },
      walletAddress: user.wallet_address
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
