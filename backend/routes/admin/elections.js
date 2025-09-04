// backend/routes/admin/elections.js

const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");

// ✅ Create an election
router.post("/", adminAuth, async (req, res) => {
  const { electionId, name, type, startTime, endTime, statesEnabled } = req.body;

  if (!electionId || !name || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["ac", "pc"].includes(type)) {
    return res.status(400).json({ error: "Invalid election type. Must be 'ac' or 'pc'" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    return res.status(400).json({ error: "End time must be at least 1 day after start time" });
  }

  try {
    const states = type === "ac"
      ? Array.isArray(statesEnabled) ? statesEnabled : []
      : []; // for 'pc', no state filtering (all states)

    await pool.query(
      `INSERT INTO elections (election_id, name, type, start_time, end_time, states_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [electionId, name, type, startTime, endTime, states]
    );

    res.status(201).json({ message: "✅ Election created successfully" });
  } catch (err) {
    console.error("❌ Error creating election:", err);
    res.status(500).json({ error: "Failed to create election" });
  }
});

// ✅ List all elections
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
