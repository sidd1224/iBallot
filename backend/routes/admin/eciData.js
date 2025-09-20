const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

/**
 * ECI Admin Data Management Routes
 * These routes allow ECI admins to view and manage voter data
 */

/**
 * @route   GET /admin/eci-data
 * @desc    Get all ECI admin data (voter constituency and wallet information)
 * @access  Admin only (should be protected with admin auth middleware)
 */
router.get("/", async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT 
        e.uid_hash,
        e.ac_name,
        e.pc_name,
        e.ward_number,
        e.wallet_address,
        e.created_at,
        e.updated_at,
        u.username,
        u.full_name,
        u.phone_number
      FROM eci_admin_data e
      LEFT JOIN users u ON e.uid_hash = u.uid_hash
      ORDER BY e.created_at DESC
    `);

    res.status(200).json({
      success: true,
      message: "ECI admin data retrieved successfully",
      data: result.rows
    });

  } catch (err) {
    console.error("❌ Error fetching ECI data:", err);
    res.status(500).json({ error: "Failed to fetch ECI data", details: err.message });
  } finally {
    if (client) client.release();
  }
});

/**
 * @route   GET /admin/eci-data/:uid_hash
 * @desc    Get specific voter's ECI data by UID hash
 * @access  Admin only
 */
router.get("/:uid_hash", async (req, res) => {
  let client;
  
  try {
    const { uid_hash } = req.params;
    
    client = await pool.connect();

    const result = await client.query(`
      SELECT 
        e.uid_hash,
        e.ac_name,
        e.pc_name,
        e.ward_number,
        e.wallet_address,
        e.created_at,
        e.updated_at,
        u.username,
        u.full_name,
        u.phone_number
      FROM eci_admin_data e
      LEFT JOIN users u ON e.uid_hash = u.uid_hash
      WHERE e.uid_hash = $1
    `, [uid_hash]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Voter data not found" });
    }

    res.status(200).json({
      success: true,
      message: "Voter ECI data retrieved successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Error fetching voter ECI data:", err);
    res.status(500).json({ error: "Failed to fetch voter ECI data", details: err.message });
  } finally {
    if (client) client.release();
  }
});

/**
 * @route   GET /admin/eci-data/stats/summary
 * @desc    Get summary statistics of ECI data
 * @access  Admin only
 */
router.get("/stats/summary", async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();

    // Get total voters registered
    const totalVoters = await client.query("SELECT COUNT(*) as count FROM eci_admin_data");
    
    // Get voters by assembly constituency
    const votersByAC = await client.query(`
      SELECT ac_name, COUNT(*) as count 
      FROM eci_admin_data 
      GROUP BY ac_name 
      ORDER BY count DESC
    `);
    
    // Get voters by parliament constituency
    const votersByPC = await client.query(`
      SELECT pc_name, COUNT(*) as count 
      FROM eci_admin_data 
      GROUP BY pc_name 
      ORDER BY count DESC
    `);

    res.status(200).json({
      success: true,
      message: "ECI data statistics retrieved successfully",
      data: {
        totalVoters: parseInt(totalVoters.rows[0].count),
        votersByAssembly: votersByAC.rows,
        votersByParliament: votersByPC.rows
      }
    });

  } catch (err) {
    console.error("❌ Error fetching ECI statistics:", err);
    res.status(500).json({ error: "Failed to fetch ECI statistics", details: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
