// backend/routes/admin/elections.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
const contract = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

// Create an election (This part remains unchanged)
router.post("/", adminAuth, async (req, res) => {
  const { electionId, name, type, startTime, endTime, enabled_constituencies } = req.body;

  if (!electionId || !name || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO elections (election_id, name, type, start_time, end_time, enabled_constituencies)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [electionId, name, type, startTime, endTime, enabled_constituencies || []]
    );

    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
    
    // Pass electionId to the contract function if it supports it
    // Assuming the contract's startElection function is for a single, global election time
    const tx = await retryBlockchainCall(() => contract.startElection(startTimestamp, endTimestamp));
    await tx.wait();

    await client.query("COMMIT");
    res.status(201).json({ message: "✅ Election created successfully on database and blockchain" });

  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error creating election:", err);
    res.status(500).json({ error: "Failed to create election", details: err.message });
  } finally {
    if (client) client.release();
  }
});

// --- UPDATED: List all elections (only from database) ---
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