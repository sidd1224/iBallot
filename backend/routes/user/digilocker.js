const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

/**
 * Mock Digilocker API endpoints for development and testing
 * In production, this would integrate with the actual Digilocker API
 */

/**
 * Helper function to calculate age from a Date of Birth string (e.g., "YYYY-MM-DD").
 */
function getAgeFromDOB(dobStr) {
  const dob = new Date(dobStr);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

/**
 * @route   POST /digilocker/verify-phone
 * @desc    Mock endpoint to verify phone number and return user metadata from database
 * @access  Public
 */
router.post("/verify-phone", async (req, res) => {
  let client;
  
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Basic phone number validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number format. Please enter a valid 10-digit Indian mobile number." });
    }

    client = await pool.connect();

    // Query the mock data table for the phone number
    const result = await client.query(
      "SELECT phone_number, uid, dob, full_name FROM digilocker_mock_data WHERE phone_number = $1",
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "Phone number not found in our records. Please ensure you're using a registered test phone number." 
      });
    }

    const userData = result.rows[0];
    
    // Validate age from DOB
    const age = getAgeFromDOB(userData.dob);
    if (age < 18) {
      return res.status(403).json({ 
        error: `User must be at least 18 years old to register. Current age: ${age} years.` 
      });
    }

    const responseData = {
      phoneNumber: userData.phone_number,
      uid: userData.uid,
      dob: userData.dob,
      name: userData.full_name,
      age: age,
      verified: true
    };

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
      data: responseData
    });

  } catch (err) {
    console.error("❌ Digilocker verification error:", err);
    res.status(500).json({ error: "Failed to verify phone number", details: err.message });
  } finally {
    if (client) client.release();
  }
});

/**
 * @route   GET /digilocker/test-users
 * @desc    Get list of test users for development purposes
 * @access  Public
 */
router.get("/test-users", async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();

    const result = await client.query(
      "SELECT phone_number, uid, dob, full_name FROM digilocker_mock_data ORDER BY id"
    );

    res.status(200).json({
      success: true,
      message: "Test users retrieved successfully",
      data: result.rows
    });

  } catch (err) {
    console.error("❌ Error fetching test users:", err);
    res.status(500).json({ error: "Failed to fetch test users", details: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
