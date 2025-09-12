const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, JsonRpcProvider } = require("ethers");

const pool = require("../../database/db");
const contract = require("../../blockchain/contract");
const { parseAadhaarXML } = require("../../utils/xmlParser");
const { generateVoterHash } = require("../../utils/hashUtils");
const { encrypt } = require("../../utils/aesUtils");

require("dotenv").config();

router.post("/complete", async (req, res) => {
  let client;
  let xmlPath = '';

  try {
    const { username, password, aadhaarFilename, assemblyId, parliamentId } = req.body;

    if (!username || !password || !aadhaarFilename || !assemblyId || !parliamentId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    xmlPath = path.join(__dirname, `../../adhaar/uploads/${aadhaarFilename}`);

    if (!fs.existsSync(xmlPath)) {
      return res.status(400).json({ error: "Registration session expired or file not found." });
    }

    const { reference_id } = parseAadhaarXML(xmlPath);
    const refIdHash = crypto.createHash("sha264").update(reference_id).digest("hex");

    client = await pool.connect();
    await client.query("BEGIN");

    const duplicate = await client.query("SELECT id FROM voter_metadata WHERE refid_hash = $1", [refIdHash]);
    if (duplicate.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This Aadhaar is already registered." });
    }
    
    // --- KEY CHANGES START HERE ---

    // The password is still securely hashed with bcrypt.
    const passwordHash = await bcrypt.hash(password, 10);
    
    // The username is now stored as plain text. We no longer hash it.
    // REMOVED: const usernameHash = await bcrypt.hash(username, 10);

    // --- KEY CHANGES END HERE ---

    const blobData = { reference_id, assemblyId, parliamentId };
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const encryptedBlob = encrypt(JSON.stringify(blobData), secretKey);
    const voterHash = "0x" + generateVoterHash(reference_id, process.env.SECRET_SALT);
    const wallet = Wallet.createRandom();
    const encryptedPrivateKey = encrypt(wallet.privateKey, secretKey);

    // --- UPDATE SQL QUERY ---
    // The column is now 'username' and we pass the plain 'username' variable.
    await client.query(
      `INSERT INTO voter_metadata (username, encrypted_blob, hashed_password, refid_hash, assembly_id, parliament_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, encryptedBlob, passwordHash, refIdHash, assemblyId, parliamentId]
    );

    await client.query(
      `INSERT INTO voter_control (voter_hash, enc_private_key, cast_vote, wallet_address) VALUES ($1, $2, $3, $4)`,
      [voterHash.slice(2), encryptedPrivateKey, false, wallet.address]
    );

    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);
    const tx = await signer.authorizeVoter(voterHash, wallet.address);
    await tx.wait();

    await client.query("COMMIT");

    res.status(200).json({ message: "✅ Registration complete", voterHash });

  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("❌ Registration complete error:", err);
    res.status(500).json({ error: "Failed to complete registration", details: err.message });
  
  } finally {
    if (fs.existsSync(xmlPath)) {
        try {
            fs.unlinkSync(xmlPath);
            console.log(`✅ Cleaned up file: ${aadhaarFilename}`);
        } catch (cleanupErr) {
            console.error(`⚠️ Failed to cleanup file ${aadhaarFilename}:`, cleanupErr);
        }
    }
    if (client) {
      client.release();
    }
  }
});

module.exports = router;

