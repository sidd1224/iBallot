const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Update Password Route
router.post("/update", async (req, res) => {
  try {
    const { phoneNumber, newPassword } = req.body;

    if (!phoneNumber || !newPassword) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 1. Get UID from DigiLocker Data using Phone
    // This confirms the phone number is valid in our system
    const digiResult = await pool.query(
      "SELECT uid FROM digilocker_mock_data WHERE phone_number = $1",
      [phoneNumber]
    );

    if (digiResult.rows.length === 0) {
      return res.status(404).json({ error: "Identity not found." });
    }

    const { uid } = digiResult.rows[0];

    // 2. Hash UID to find the actual User account
    const uidHash = crypto.createHash("sha256").update(uid).digest("hex");

    // 3. Hash the New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update Password in Users table
    const updateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE uid_hash = $2 RETURNING id",
      [hashedPassword, uidHash]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Voter account not found for this verified identity." });
    }

    res.json({ success: true, message: "Password updated successfully!" });

  } catch (err) {
    console.error("Reset Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;