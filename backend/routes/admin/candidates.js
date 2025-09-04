const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const contract = require("../../blockchain/contract");
const { JsonRpcProvider, Wallet } = require("ethers");

require("dotenv").config();

const upload = multer({ dest: "uploads/" });

/**
 * POST /admin/candidates/upload
 * Fields:
 * - electionId (required)
 * - electionType: "ac" or "pc"
 * - file: CSV with columns depending on type
 */
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

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      let added = 0, failed = 0;

      for (const row of results) {
        const id = electionType === "ac" ? row.assemblyId : row.parliamentaryId;
        const candidateName = row.candidateName;

        if (!id || !candidateName) {
          failed++;
          continue;
        }

        try {
          const tx = await signer.addCandidate(electionId, parseInt(id), candidateName);
          await tx.wait();
          added++;
        } catch (err) {
          console.error("❌ Failed to add candidate:", row, err.message);
          failed++;
        }
      }

      fs.unlinkSync(filePath); // clean up file
      res.json({ message: "✅ Upload complete", added, failed });
    })
    .on("error", (err) => {
      console.error("❌ Error reading CSV:", err);
      res.status(500).json({ error: "Failed to process CSV" });
    });
});

module.exports = router;
