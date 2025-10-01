const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");

/**
 * @route   GET /admin/dashboard/summary
 * @desc    Get summary statistics for the admin dashboard homepage.
 * @access  Admin
 */
router.get("/summary", adminAuth, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    // Run all count queries in parallel for efficiency
    const [
      voterCountResult,
      activeElectionCountResult,
      candidateCountResult
    ] = await Promise.all([
      client.query("SELECT COUNT(*) FROM users"),
      client.query("SELECT COUNT(*) FROM elections WHERE start_time <= NOW() AND end_time >= NOW()"),
      client.query("SELECT COUNT(*) FROM candidates")
    ]);

    const stats = {
      totalVoters: parseInt(voterCountResult.rows[0].count, 10),
      activeElections: parseInt(activeElectionCountResult.rows[0].count, 10),
      totalCandidates: parseInt(candidateCountResult.rows[0].count, 10)
    };

    res.status(200).json({ success: true, stats });

  } catch (err) {
    console.error("❌ Error fetching dashboard summary:", err);
    res.status(500).json({ error: "Failed to fetch dashboard summary", details: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
