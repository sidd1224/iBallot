const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");

require("dotenv").config();

/**
 * @route   POST /login
 * @desc    Authenticates a user with username and password.
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    // Step 1: Find the user by their plain-text username.
    const result = await pool.query("SELECT * FROM voter_metadata WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = result.rows[0];

    // Step 2: Compare the provided password with the stored bcrypt hash.
    const isPasswordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // --- DECRYPTION LOGIC UPDATED HERE ---
    // Step 3: Decrypt the user's data blob using the consistent, global secret key.
    // This now matches the encryption method used in register_complete.js.
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const decryptedBlobString = decrypt(user.encrypted_blob, secretKey);
    const blobData = JSON.parse(decryptedBlobString); // Contains reference_id

    // Step 4: Regenerate the voter hash to confirm identity and for later use.
    const voterHash = "0x" + generateVoterHash(blobData.reference_id, process.env.SECRET_SALT);

    // Step 5: Send a success response.
    res.status(200).json({
      message: "✅ Login successful",
      voterHash: voterHash,
    });

  } catch (err) {
    console.error("❌ Login error:", err); // Log the detailed error on the server
    res.status(500).json({ error: "Login failed due to an internal server error." });
  }
});

module.exports = router;

