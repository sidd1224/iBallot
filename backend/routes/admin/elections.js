const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
const contract = require("../../blockchain/contract"); // 1. Import the contract
const { retryBlockchainCall } = require("../../utils/blockchainUtils"); // 2. Import the retry helper

// Create an election
router.post("/", adminAuth, async (req, res) => {
  const { electionId, name, type, startTime, endTime, enabled_constituencies } = req.body;

  if (!electionId || !name || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Add validation for other fields as needed...

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN"); // Start a database transaction

    // Step 1: Insert the election into the PostgreSQL database
    await client.query(
      `INSERT INTO elections (election_id, name, type, start_time, end_time, enabled_constituencies)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [electionId, name, type, startTime, endTime, enabled_constituencies || []]
    );

    // Step 2: Call the startElection function on the smart contract.
    // The contract expects Unix timestamps (in seconds), not date strings.
    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
    
    console.log(`Starting election on-chain with start: ${startTimestamp}, end: ${endTimestamp}`);

    // Use the retry helper for network resilience
    const tx = await retryBlockchainCall(() => contract.startElection(startTimestamp, endTimestamp));
    await retryBlockchainCall(() => tx.wait());

    console.log(`On-chain election started, tx: ${tx.hash}`);

    // If both operations succeed, commit the database transaction
    await client.query("COMMIT");

    res.status(201).json({ message: "✅ Election created successfully on database and blockchain" });

  } catch (err) {
    if (client) await client.query("ROLLBACK"); // If any step fails, roll back the database change
    console.error("❌ Error creating election:", err);
    res.status(500).json({ error: "Failed to create election", details: err.message });
  } finally {
    if (client) client.release();
  }
});

// List all elections (no changes needed here)
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM elections ORDER BY start_time DESC");
    res.json({ elections: result.rows });
  } catch (err) {
    console.error("❌ Error listing elections:", err);
    res.status(500).json({ error: "Failed to fetch elections" });
  }
});

module.exports = router;
