const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const multer = require("multer");

const pool = require("../../database/db");
const { parseAadhaarXML } = require("../../utils/xmlParser");
const { encrypt } = require("../../utils/aesUtils");
const { matchDistrictToConstituencies } = require("../../utils/fuzzyDistrictMatcher");

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../adhaar/uploads/');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'reregister-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * @route   POST /re-register
 * @desc    Updates a user's constituency data after address change.
 * @access  Private (requires username/password)
 */
router.post("/", upload.single('newAadhaarFile'), async (req, res) => {
  let client;
  let newXmlPath = '';

  try {
    const { username, password, newAssemblyId, newParliamentId } = req.body;

    // Step 1: Validate input
    if (!username || !password || !newAssemblyId || !newParliamentId) {
      return res.status(400).json({ error: "Missing username, password, or new constituency IDs." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "New Aadhaar XML file is required." });
    }
    
    newXmlPath = req.file.path;

    // Step 2: Authenticate the user (similar to login)
    client = await pool.connect();
    const result = await client.query("SELECT * FROM voter_metadata WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = result.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Step 3: Parse the NEW Aadhaar file to ensure it matches the original person
    const { reference_id: newRefId } = parseAadhaarXML(newXmlPath);
    const newRefIdHash = crypto.createHash("sha256").update(newRefId).digest("hex");

    // Security Check: Ensure the new Aadhaar belongs to the same person
    if (newRefIdHash !== user.refid_hash) {
      return res.status(403).json({ error: "The new Aadhaar details do not match the existing registration." });
    }

    // Step 4: Prepare new encrypted blob and update the database
    const newBlobData = { reference_id: newRefId, assemblyId: newAssemblyId, parliamentId: newParliamentId };
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const newEncryptedBlob = encrypt(JSON.stringify(newBlobData), secretKey);

    await client.query(
      `UPDATE voter_metadata
       SET encrypted_blob = $1, assembly_id = $2, parliament_id = $3
       WHERE refid_hash = $4`,
      [newEncryptedBlob, newAssemblyId, newParliamentId, user.refid_hash]
    );

    res.status(200).json({ message: "✅ Address and constituency successfully updated." });

  } catch (err) {
    console.error("❌ Re-registration error:", err);
    res.status(500).json({ error: "Re-registration failed", details: err.message });

  } finally {
    // Always clean up the uploaded file and release the DB client
    if (fs.existsSync(newXmlPath)) {
      fs.unlinkSync(newXmlPath);
    }
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
