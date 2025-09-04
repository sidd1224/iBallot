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
const matchDistrictToAssembly = require("../../utils/fuzzyDistrictMatcher");

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

    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) return res.status(400).json({ error: "Phone number not found in token" });

    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    const xmlPath = path.join(__dirname, `../../adhaar/${aadhaarFilePath}`);
    const { reference_id: refId, dob, district_name, state_name } = parseAadhaarXML(xmlPath);

    if (!dob) return res.status(400).json({ error: "DOB missing in Aadhaar" });
    const age = getAgeFromDOB(dob);
    if (age < 18) return res.status(403).json({ error: "Must be 18+ to re-register" });

    const refIdHash = crypto.createHash("sha256").update(refId).digest("hex");
    const result = await pool.query("SELECT phone FROM voter_metadata WHERE refid_hash = $1", [refIdHash]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No existing registration found for this Aadhaar" });
    }

    // ✅ Match assembly ID from fuzzy district matcher
    const assemblyId = await matchDistrictToAssembly(state_name, district_name);
    if (!assemblyId) {
      return res.status(400).json({ error: "Could not match your district to any assembly" });
    }

    // ✅ Update phone, encrypted blob, password
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(phone, salt, 32);
    const encryptedBlob = encrypt(
      JSON.stringify({ reference_id: refId, phone, assembly_id: assemblyId }),
      key
    );
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE voter_metadata
       SET phone = $1, encrypted_blob = $2, salt = $3, hashed_password = $4
       WHERE refid_hash = $5`,
      [phoneHash, encryptedBlob, salt.toString("hex"), hashedPassword, refIdHash]
    );

    res.status(200).json({ message: "✅ Re-registration successful" });

  } catch (err) {
    console.error("❌ Re-registration error:", err);
    res.status(500).json({ error: "Re-registration failed", details: err.message });
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
