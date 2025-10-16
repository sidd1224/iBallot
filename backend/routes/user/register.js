const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, JsonRpcProvider } = require("ethers");

const pool = require("../../database/db");
const contract = require("../../blockchain/contract");
const { encrypt } = require("../../utils/aesUtils");
const { retryBlockchainCall } = require("../../utils/blockchainUtils"); // Import the helper
const { body, validationResult } = require('express-validator');

require("dotenv").config();

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
 * @route   POST /register
 * @desc    Handles complete registration process with Digilocker verification.
 * Creates user record and populates ECI admin data with wallet information.
 * @access  Public
 */
router.post("/", 
  // --- NEW: Add validation middleware ---
  body('username').isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('phoneNumber').isMobilePhone('en-IN').withMessage('Invalid Indian phone number.'),
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
      return res.status(404).json({ 
        error: "Phone number not found in Digilocker records. Please verify via Digilocker first." 
      });
    }

    const digilockerData = digilockerResult.rows[0];
    
    // Validate age from Digilocker DOB
    const age = getAgeFromDOB(digilockerData.dob);
    if (age < 18) {
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
      return res.status(409).json({ error: "This username is already taken." });
    }
    
    if (duplicateUid.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This Aadhaar number is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate wallet and encrypt private key
    const wallet = Wallet.createRandom();
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
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
      return res.status(400).json({ error: "ECI admin data missing for this UID" });
    }

    // Authorize voter on blockchain
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);

    // --- UPDATED: Wrapped the blockchain call in the retry helper ---
    const tx = await retryBlockchainCall(() => signer.authorizeVoter(voterHash, wallet.address));
    await tx.wait();

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
    if (client) await client.query("ROLLBACK");
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Failed to complete registration", details: err.message });
  
  } finally {
    if (client) client.release();
  }
});

module.exports = router;

