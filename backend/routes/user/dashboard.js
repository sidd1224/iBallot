const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

/**
 * @route   GET /dashboard
 * @desc    Fetch elections for which the logged-in user is eligible (fix: normalize enabled_constituencies)
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

    // Step 1: Get user's constituency IDs
    const userConstituencyQuery = await client.query(
      `SELECT e.ac_id, e.pc_id 
       FROM eci_admin_data e
       JOIN users u ON e.uid_hash = u.uid_hash
       WHERE u.username = $1`,
      [username]
    );

    if (userConstituencyQuery.rows.length === 0) {
      return res.status(404).json({ error: "User constituency data not found." });
    }

    const { ac_id, pc_id } = userConstituencyQuery.rows[0];
    const acId = ac_id ? String(ac_id) : null;
    const pcId = pc_id ? String(pc_id) : null;

    console.log(`🔍 User ${username}: AC=${acId}, PC=${pcId}`);

    // Step 2: Fetch all currently active elections
    const activeElectionsQuery = await client.query(
      `SELECT election_id, name, type, start_time, end_time, enabled_constituencies
       FROM elections
       WHERE start_time <= NOW() AND end_time >= NOW()
       ORDER BY start_time DESC`
    );

    // Normalize enabled_constituencies safely
    const normalizeEnabled = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String);

      if (typeof val === "object") {
        try {
          return Object.values(val).map(String);
        } catch {
          return [];
        }
      }

      if (typeof val === "string") {
        try {
          // Try parsing valid JSON
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
          // Handle [1,2] or {1,2}
          const cleaned = val.replace(/[\[\]\{\}\s]/g, "");
          if (!cleaned) return [];
          return cleaned.split(",").filter(Boolean).map(String);
        }
      }
      return [];
    };

    const activeElections = activeElectionsQuery.rows.map((e) => ({
      ...e,
      enabled_constituencies: normalizeEnabled(e.enabled_constituencies),
    }));
    console.log("🔍 Active elections raw:", activeElections);
      

    // Step 3: Filter eligible elections
    const eligibleElections = activeElections.filter((election) => {
      const enabled = election.enabled_constituencies;

      // Election open to all
      if (!enabled || enabled.length === 0) return true;

      const type = (election.type || "").toUpperCase();

      if (type.includes("STATE")) {
        return acId && enabled.includes(acId);
      }
      if (type.includes("PARLIAMENTARY")) {
        return pcId && enabled.includes(pcId);
      }

      return false;
    });

    console.log(`✅ Eligible elections for ${username}:`, eligibleElections.map(e => e.name));

    res.status(200).json({
      success: true,
      elections: eligibleElections,
    });

  } catch (err) {
    console.error("❌ Error fetching dashboard:", err);
    res.status(500).json({
      error: "Failed to fetch dashboard",
      details: err.message,
    });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
