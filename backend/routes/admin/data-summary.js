const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");

/**
 * @route   GET /admin/dashboard/summary
 * @desc    Get voter statistics: Total Eligible (ECI), Registered (App), and Assembly-wise breakdown.
 * @access  Admin
 */
router.get("/summary", adminAuth, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    // 1. Total Eligible Voters (Everyone in ECI Database)
    const totalEligibleRes = await client.query("SELECT COUNT(*) FROM eci_admin_data");
    
    // 2. Total Registered Users (People who signed up on App)
    const totalRegisteredRes = await client.query("SELECT COUNT(*) FROM users");

    // 3. Assembly-wise Breakdown
    // We join eci_admin_data (left) with users to count how many eligible voters have registered in each AC.
    const assemblyQuery = `
      SELECT 
        e.ac_id,
        COUNT(e.uid_hash) AS "eligibleCount",
        COUNT(u.uid_hash) AS "registeredCount"
      FROM eci_admin_data e
      LEFT JOIN users u ON e.uid_hash = u.uid_hash
      GROUP BY e.ac_id
      ORDER BY e.ac_id ASC
    `;
    const assemblyRes = await client.query(assemblyQuery);

    const stats = {
      totalEligible: parseInt(totalEligibleRes.rows[0].count, 10),
      totalRegistered: parseInt(totalRegisteredRes.rows[0].count, 10),
      assemblyData: assemblyRes.rows.map(row => ({
        ac_id: row.ac_id,
        eligible: parseInt(row.eligibleCount, 10),
        registered: parseInt(row.registeredCount, 10)
      }))
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