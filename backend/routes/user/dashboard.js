const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

/**
 * @route   GET /dashboard
 * @desc    Fetches elections for which the logged-in user is eligible using numeric constituency IDs.
 * @access  Private
 */
router.get("/", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(401).json({ error: "Username is required as a query parameter." });
  }

  let client;

  try {
    client = await pool.connect();

    // Step 1: Get the user's numeric constituency IDs from the database
    const userConstituencyQuery = await client.query(
      `SELECT e.ac_id, e.pc_id FROM eci_admin_data e
       JOIN users u ON e.uid_hash = u.uid_hash
       WHERE u.username = $1`,
      [username]
    );

    if (userConstituencyQuery.rows.length === 0) {
      return res.status(404).json({ error: "User constituency data not found." });
    }
    const userConstituency = userConstituencyQuery.rows[0];

    // Step 2: Get all currently active elections
    const activeElectionsQuery = await client.query(
      `SELECT election_id, name, type, start_time, end_time, enabled_constituencies
       FROM elections
       WHERE start_time <= NOW() AND end_time >= NOW()`
    );

    const activeElections = activeElectionsQuery.rows;

    // Step 3: Filter elections based on the user's numeric constituency ID
    const eligibleElections = activeElections.filter(election => {
      // If enabled_constituencies is null or empty, the election is open to all
      if (!election.enabled_constituencies || election.enabled_constituencies.length === 0) {
        return true;
      }

      // Check for eligibility based on election type and the user's numeric IDs
      if (election.type === 'STATE_LEGISLATIVE') {
        return election.enabled_constituencies.includes(userConstituency.ac_id);
      }
      
      if (election.type === 'PARLIAMENTARY') {
        return election.enabled_constituencies.includes(userConstituency.pc_id);
      }
      
      return false;
    });

    res.status(200).json({
      success: true,
      elections: eligibleElections,
    });

  } catch (err) {
    console.error("❌ Error fetching active elections:", err);
    res.status(500).json({ error: "Failed to fetch active elections", details: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;

