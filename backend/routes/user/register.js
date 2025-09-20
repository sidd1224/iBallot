const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, JsonRpcProvider } = require("ethers");

const pool = require("../../database/db");
const contract = require("../../blockchain/contract");
const { encrypt } = require("../../utils/aesUtils");

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
router.post("/", async (req, res) => {
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
      `INSERT INTO users (username, uid_hash, password, phone_number, full_name) VALUES ($1, $2, $3, $4, $5)`,
      [username, uidHash, passwordHash, digilockerData.phone_number, digilockerData.full_name]
    );

    // Insert/Update ECI admin data with wallet information
    // Note: ECI admin should pre-populate constituency data, we only add wallet info
    await client.query(
      `INSERT INTO eci_admin_data (uid_hash, ac_name, pc_name, ward_number, enc_private_key, wallet_address) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (uid_hash) 
       DO UPDATE SET 
         enc_private_key = EXCLUDED.enc_private_key,
         wallet_address = EXCLUDED.wallet_address,
         updated_at = CURRENT_TIMESTAMP`,
      [uidHash, 'Default AC', 'Default PC', 'Default Ward', encryptedPrivateKey, wallet.address]
    );

    // Authorize voter on blockchain
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);
    const tx = await signer.authorizeVoter(voterHash, wallet.address);
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