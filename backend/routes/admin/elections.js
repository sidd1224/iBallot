// backend/routes/admin/elections.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
const { contract } = require("../../blockchain/contract"); // Import the contract instance
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

// Create an election
// Create an election
router.post("/", adminAuth, async (req, res) => {
  const { electionId, name, type, startTime, endTime, enabled_constituencies } = req.body;

  if (!electionId || !name || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // ✅ Normalize enabled_constituencies into a proper JSON array
    let enabledArray = [];
    if (enabled_constituencies) {
      if (Array.isArray(enabled_constituencies)) {
        enabledArray = enabled_constituencies.map(Number);
      } else if (typeof enabled_constituencies === "string") {
        // Convert "1,2,3" → [1,2,3]
        enabledArray = enabled_constituencies
          .split(",")
          .map(v => v.trim())
          .filter(Boolean)
          .map(Number);
      }
    }

    console.log("🧩 Normalized enabled_constituencies:", enabledArray);

    // ✅ Insert into database safely with JSON.stringify()
    await client.query(
      `INSERT INTO elections (election_id, name, type, start_time, end_time, enabled_constituencies)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [electionId, name, type, startTime, endTime, JSON.stringify(enabledArray)]
    );

    // Convert times to Unix timestamps (seconds)
    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    // --- Call blockchain ---
    console.log(`Calling startElection with startTime: ${startTimestamp}, endTime: ${endTimestamp}`);
    const tx = await retryBlockchainCall(() => contract.startElection(startTimestamp, endTimestamp));
    console.log("Transaction submitted:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed:", tx.hash);

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


// List all elections (only from database)
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

