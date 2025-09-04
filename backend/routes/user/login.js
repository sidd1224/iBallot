const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");
const admin = require("../../utils/firebaseAdmin");

require("dotenv").config();

router.post("/", async (req, res) => {
  try {
    const { idToken, password } = req.body;
    if (!idToken || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Step 1: Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) return res.status(400).json({ error: "Phone number not found in token" });

    // Step 2: Hash phone
    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    // Step 3: Fetch user from DB
    const result = await pool.query("SELECT * FROM voter_metadata WHERE phone = $1", [phoneHash]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Voter not registered" });
    }

    const user = result.rows[0];

    // Step 4: Verify password
    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

    // Step 5: Decrypt blob to extract refId
    const key = crypto.scryptSync(phone, Buffer.from(user.salt, "hex"), 32);
    const decryptedBlob = decrypt(Buffer.from(user.encrypted_blob, "base64"), key); // ✅ Decode before decrypting

    const { reference_id: refId } = JSON.parse(decryptedBlob);

    // Step 6: Regenerate voter hash
    const voterHash = "0x" + generateVoterHash(refId, process.env.SECRET_SALT);

    // Step 7: Success
    res.status(200).json({
      message: "✅ Login successful",
      voterHash,
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

module.exports = router;
