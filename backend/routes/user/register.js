const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const pool = require("../../database/db");
const { parseAadhaarXML } = require("../../utils/xmlParser");
const { generateVoterHash } = require("../../utils/hashUtils");
const { encrypt } = require("../../utils/aesUtils");
const { matchDistrictToAssembly } = require("../../utils/fuzzyDistrictMatcher");



const { Wallet, JsonRpcProvider } = require("ethers");
const contract = require("../../blockchain/contract");

const admin = require("../../utils/firebaseAdmin");
require("dotenv").config();

router.post("/", async (req, res) => {
  try {
    const { idToken, password, aadhaarFilePath } = req.body;

    if (!idToken || !password || !aadhaarFilePath) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ 1. Verify Firebase ID token and extract phone number
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) return res.status(400).json({ error: "Phone number not found in ID token" });

    // ✅ 2. Hash phone
    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    const existing = await pool.query("SELECT * FROM voter_metadata WHERE phone = $1", [phoneHash]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    // ✅ 3. Parse Aadhaar XML
    const xmlPath = path.join(__dirname, `../../adhaar/${aadhaarFilePath}`);
    const { reference_id: refId, dob, state_name, district_name } = parseAadhaarXML(xmlPath);

    // ✅ 3.1 Match district + state to assembly ID
const matched = await matchDistrictToAssembly(state_name, district_name);
if (!matched) {
  return res.status(422).json({ error: `Could not match your district (${district_name}) to any assembly constituency.` });
}
const assemblyId = matched.assemblyId;


    // ✅ 4. Check age
    if (!dob) return res.status(400).json({ error: "DOB missing in Aadhaar" });
    const age = getAgeFromDOB(dob);
    if (age < 18) {
      return res.status(403).json({ error: "You must be at least 18 years old to register" });
    }

    // ✅ 5. Hash reference ID to check for existing Aadhaar
    const refIdHash = crypto.createHash("sha256").update(refId).digest("hex");

    const duplicate = await pool.query("SELECT phone FROM voter_metadata WHERE refid_hash = $1", [refIdHash]);
    if (duplicate.rows.length > 0) {
      const registeredPhoneHash = duplicate.rows[0].phone;
      if (registeredPhoneHash !== phoneHash) {
        return res.status(409).json({
          error: "Aadhaar already registered with another phone. Please request phone update."
        });
      } else {
        return res.status(409).json({ error: "This Aadhaar is already registered." });
      }
    }

    // ✅ 6. Generate encryption key from phone + salt
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(phone, salt, 32);

    // ✅ 7. Encrypt Aadhaar + phone
    const rawBlob = encrypt(JSON.stringify({ reference_id: refId, phone, assemblyId }), key);
    const encryptedBlob = Buffer.from(rawBlob).toString("base64"); // ✅ Convert binary to UTF-8-safe string

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 8. Generate voter hash
    const voterHash = "0x" + generateVoterHash(refId, process.env.SECRET_SALT);

    // ✅ 9. Generate wallet
    const wallet = Wallet.createRandom();
    const encryptedPrivateKey = encrypt(wallet.privateKey, key);

    // ✅ 10. Save to DB (with refid_hash + assemblyId)
    await pool.query(
      "INSERT INTO voter_metadata(phone, encrypted_blob, salt, hashed_password, refid_hash) VALUES ($1, $2, $3, $4, $5)",
      [phoneHash, encryptedBlob, salt.toString("hex"), hashedPassword, refIdHash]
    );

    await pool.query(
      "INSERT INTO voter_control(voter_hash, enc_private_key, cast_vote, wallet_address) VALUES ($1, $2, $3, $4)",
      [voterHash.slice(2), encryptedPrivateKey, false, wallet.address]
    );

    // ✅ 11. Authorize on-chain
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);

    const tx = await signer.authorizeVoter(voterHash, wallet.address);
    await tx.wait();

    res.status(200).json({ message: "✅ Registration successful", voterHash });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// Helper to compute age
function getAgeFromDOB(dob) {
  const birthDate = new Date(dob.split("-").reverse().join("-")); // dd-mm-yyyy
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

module.exports = router;
