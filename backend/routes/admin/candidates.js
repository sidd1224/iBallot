// backend/routes/admin/candidates.js
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
const contract = require("../../blockchain/contract");
const { JsonRpcProvider, Wallet } = require("ethers");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

require("dotenv").config();

// --- Multer configuration for symbol images (unchanged) ---
const symbolStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'public/symbols/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const symbolUpload = multer({ storage: symbolStorage });

// Route to handle symbol image uploads (unchanged)
router.post("/upload-symbol", adminAuth, symbolUpload.array("symbols"), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded." });
    }
    const filePaths = req.files.map(file => `/symbols/${file.filename}`);
    res.status(200).json({ success: true, filePaths });
});

const upload = multer({ dest: "uploads/" });

// --- UPDATED: Faster Candidate Upload Logic ---
router.post("/upload", adminAuth, upload.single("file"), async (req, res) => {
  const electionId = parseInt(req.body.electionId);
  const electionType = req.body.electionType?.toLowerCase();

  if (!electionId || !["ac", "pc"].includes(electionType)) {
    return res.status(400).json({ error: "Missing or invalid electionId or electionType (ac|pc)" });
  }

  const filePath = req.file?.path;
  if (!filePath) return res.status(400).json({ error: "CSV file not provided" });

  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const signer = contract.connect(new Wallet(process.env.RELAYER_PRIVATE_KEY, provider));

  const results = [];
  const client = await pool.connect();

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      let added = 0, failed = 0, skipped = 0;

      try {
        await client.query("BEGIN");

        // --- OPTIMIZATION: Get starting candidate counters once ---
        const constituencyCounters = {};
        for (const row of results) {
            const constituencyId = parseInt(row.assemblyId || row.parliamentaryId);
            if (constituencyId && constituencyCounters[constituencyId] === undefined) {
                const count = await retryBlockchainCall(() => contract.candidateCounter(electionId, constituencyId));
                constituencyCounters[constituencyId] = Number(count);
            }
        }

        for (const row of results) {
          const constituencyId = parseInt(row.assemblyId || row.parliamentaryId);
          const { candidateName, party_name, symbol } = row;

          if (!constituencyId || !candidateName) {
            failed++;
            continue;
          }

          const existingCandidate = await client.query(
            `SELECT id FROM candidates WHERE election_id = $1 AND constituency_id = $2 AND candidate_name = $3`,
            [electionId, constituencyId, candidateName]
          );

          if (existingCandidate.rows.length > 0) {
            skipped++;
            continue;
          }

          // --- OPTIMIZATION: Use the local counter ---
          const candidateId = constituencyCounters[constituencyId];

          await client.query(
            `INSERT INTO candidates (election_id, candidate_id, candidate_name, party_name, symbol, constituency_id) VALUES ($1, $2, $3, $4, $5, $6)`,
            [electionId, candidateId, candidateName, party_name, symbol, constituencyId]
          );

          const tx = await retryBlockchainCall(() => signer.addCandidate(electionId, constituencyId, candidateName));
          await tx.wait();

          // --- OPTIMIZATION: Increment the local counter ---
          constituencyCounters[constituencyId]++;
          added++;
        }

        await client.query("COMMIT");
        res.json({ 
          message: `✅ Upload complete. Added: ${added}, Skipped (duplicates): ${skipped}, Failed: ${failed}`,
          added, skipped, failed
        });

      } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Failed to process candidates:", err.message);
        failed = results.length - added - skipped;
        res.status(500).json({ error: "Failed to process candidates", details: err.message, added, skipped, failed });
      } finally {
        fs.unlinkSync(filePath);
        client.release();
      }
    })
    .on("error", (err) => {
      console.error("❌ Error reading CSV:", err);
      client.release();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: "Failed to process CSV" });
    });
});

module.exports = router;