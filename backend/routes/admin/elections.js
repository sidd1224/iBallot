// backend/routes/admin/elections.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
const { contract } = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

// Create a new election
router.post("/", adminAuth, async (req, res) => {
  const { electionId, name, type, startTime, endTime, enabled_constituencies } = req.body;

  if (!electionId || !name || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ✅ Normalize enabled_constituencies
  let enabledArray = [];
  if (Array.isArray(enabled_constituencies)) {
    enabledArray = enabled_constituencies.map(String);
  } else if (typeof enabled_constituencies === "string") {
    enabledArray = enabled_constituencies
      .replace(/[\[\]\s]/g, "") // remove brackets & spaces
      .split(",")
      .filter(Boolean)
      .map(String);
  }

  console.log("🧩 Normalized enabled_constituencies:", enabledArray);

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // ✅ Save election in database
    await client.query(
      `INSERT INTO elections (election_id, name, type, start_time, end_time, enabled_constituencies)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [electionId, name, type, startTime, endTime, JSON.stringify(enabledArray)]
    );

    // ✅ Convert times to UNIX seconds for blockchain
    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    console.log(`🚀 Starting election ${name} [${electionId}] from ${startTimestamp} → ${endTimestamp}`);

    // ✅ Blockchain call
    const tx = await retryBlockchainCall(() =>
      contract.startElection(startTimestamp, endTimestamp)
    );
    console.log("⛓️  Transaction submitted:", tx.hash);

    await tx.wait();
    console.log("✅ Transaction confirmed:", tx.hash);

    await client.query("COMMIT");

    res.status(201).json({
      message: "✅ Election created successfully on database and blockchain",
      election: { electionId, name, type, enabled_constituencies: enabledArray },
    });

  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error creating election:", err);

    res.status(500).json({
      error: "Failed to create election",
      details: err.reason || err.message || "Unknown error",
    });
  } finally {
    if (client) client.release();
  }
});

// Fetch all elections (admin panel)
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM elections ORDER BY start_time DESC");
    res.json({ elections: result.rows });
  } catch (err) {
    console.error("❌ Error fetching elections:", err);
    res.status(500).json({ error: "Failed to fetch elections" });
  }
});

module.exports = router;
