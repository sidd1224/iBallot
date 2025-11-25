const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, JsonRpcProvider } = require("ethers"); // Keep Wallet for creation

const pool = require("../../database/db");
// --- FIX: Use the contract directly, no need for JsonRpcProvider/Wallet here ---
const { contract } = require("../../blockchain/contract");
const { encrypt } = require("../../utils/aesUtils");
const { retryBlockchainCall } = require("../../utils/blockchainUtils"); // Import the helper
const { body, validationResult } = require('express-validator');

require("dotenv").config();

/**
 * Helper function to calculate age from a Date of Birth string (e.g., "YYYY-MM-DD").
 */
function getAgeFromDOB(dobStr) {
  if (!dobStr) return 0; // Handle null or undefined DOB
  try {
      const dob = new Date(dobStr);
      if (isNaN(dob.getTime())) return 0; // Handle invalid date format
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms);
      return Math.abs(age_dt.getUTCFullYear() - 1970);
  } catch (e) {
      console.error("Error parsing DOB:", dobStr, e);
      return 0; // Return 0 on error
  }
}


/**
 * @route   POST /register
 * @desc    Handles complete registration process with Digilocker verification.
 * Creates user record and populates ECI admin data with wallet information.
 * @access  Public
 */
router.post("/",
  // --- NEW: Add validation middleware ---
  body("username").isAlphanumeric().withMessage("Username must be alphanumeric."),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain at least one number.")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character."), // \W is any non-word character
  body("phoneNumber").isMobilePhone("en-IN").withMessage("Invalid Indian phone number."),
  // --- END NEW ---
  async (req, res) => {
    // --- NEW: Check for validation errors ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  let client;

  try {
    const { username, password, phoneNumber } = req.body;

    // Redundant check, already handled by validation, but keep for safety
    if (!username || !password || !phoneNumber) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Verify phone number with Digilocker mock data
    client = await pool.connect();
    const digilockerResult = await client.query(
      "SELECT phone_number, uid, dob, full_name FROM digilocker_mock_data WHERE phone_number = $1",
      [phoneNumber]
    );

    if (digilockerResult.rows.length === 0) {
       if (client) client.release();
      return res.status(404).json({
        error: "Phone number not found in Digilocker records. Please verify via Digilocker first."
      });
    }

    const digilockerData = digilockerResult.rows[0];

    // Validate age from Digilocker DOB
    const age = getAgeFromDOB(digilockerData.dob);
    if (age < 18) {
       if (client) client.release();
      return res.status(403).json({
        error: `Voter must be at least 18 years old. Current age: ${age} years.`
      });
    }

    const uidHash = crypto.createHash("sha256").update(digilockerData.uid).digest("hex");

    await client.query("BEGIN");

    // Check for duplicate username or UID
    const duplicateUsername = await client.query("SELECT id FROM users WHERE username = $1", [username]);
    const duplicateUid = await client.query("SELECT id FROM users WHERE uid_hash = $1", [uidHash]);

    if (duplicateUsername.rows.length > 0) {
      await client.query("ROLLBACK");
      if (client) client.release();
      return res.status(409).json({ error: "This username is already taken." });
    }

    if (duplicateUid.rows.length > 0) {
      await client.query("ROLLBACK");
      if (client) client.release();
      return res.status(409).json({ error: "This Aadhaar number is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate wallet and encrypt private key
    const wallet = Wallet.createRandom();
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT || 'default_salt', "aadhaar_salt", 32); // Added fallback salt
    const encryptedPrivateKey = encrypt(wallet.privateKey, secretKey);
    const voterHash = "0x" + uidHash;

    // Insert into users table
    await client.query(
      `INSERT INTO users (username, uid_hash, password) VALUES ($1, $2, $3)`,
      [username, uidHash, passwordHash, ]
    );

    // Insert/Update ECI admin data with wallet information
    const result = await client.query(
      `UPDATE eci_admin_data
       SET enc_private_key = $1,
           wallet_address = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE uid_hash = $3
       RETURNING *`,
      [encryptedPrivateKey, wallet.address, uidHash]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      if (client) client.release();
      return res.status(400).json({ error: "ECI admin data missing for this UID. Cannot register." });
    }

    // --- FIX: Authorize voter on blockchain using the imported contract ---
    console.log(`Authorizing voter: Hash=${voterHash}, Address=${wallet.address}`);
    // No need to create provider, relayer, signer here. contract is already connected.
    const tx = await retryBlockchainCall(() => contract.authorizeVoter(voterHash, wallet.address));
    console.log("Transaction submitted for authorizeVoter:", tx.hash);
    await tx.wait(); // Wait for confirmation
    console.log("Transaction confirmed:", tx.hash);
    // --- END FIX ---


    await client.query("COMMIT");

    res.status(200).json({
      message: "✅ Registration complete",
      voterHash,
      walletAddress: wallet.address,
      user: {
        username: username,
        fullName: digilockerData.full_name,
        phoneNumber: digilockerData.phone_number
      }
    });

  } catch (err) {
    if (client) {
        try { await client.query("ROLLBACK"); } catch (rbErr) { console.error("Rollback failed:", rbErr); }
    }
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Failed to complete registration", details: err.message });

  } finally {
    if (client) client.release();
  }
});

module.exports = router;
