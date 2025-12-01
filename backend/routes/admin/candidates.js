// backend/routes/admin/candidates.js
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
const { contract } = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

require("dotenv").config();

// --- 1. Storage Config (Only determines path/name) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";
    if (file.fieldname === "candidatesCsv") {
      uploadPath = "uploads/";
    } else if (file.fieldname === "symbols") {
      uploadPath = "public/symbols/";
    }
    // Ensure dir exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === "candidatesCsv") {
      cb(null, Date.now() + "-" + file.originalname);
    } else if (file.fieldname === "symbols") {
      // Just return the name here. The filtering happens below.
      cb(null, file.originalname);
    }
  },
});

// --- 2. File Filter (CRITICAL FIX) ---
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "symbols") {
    const uploadDir = path.join("public", "symbols");
    const targetPath = path.join(uploadDir, file.originalname);

    if (fs.existsSync(targetPath)) {
      console.log(`⚠️ Symbol already exists, skipping write: ${file.originalname}`);
      cb(null, false);
    } else {
      cb(null, true);
    }
  } else {
    // Always accept CSVs
    cb(null, true);
  }
};

// Apply the filter
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter 
});

// Merged /upload route
router.post(
  "/upload",
  adminAuth,
  upload.fields([
    { name: 'candidatesCsv', maxCount: 1 },
    { name: 'symbols', maxCount: 100 }
  ]),
  async (req, res) => {

    const electionId = parseInt(req.body.electionId);
    const electionType = req.body.electionType?.toLowerCase(); // ac or pc

    if (!electionId || !["ac", "pc"].includes(electionType)) {
      return res.status(400).json({ error: "Missing or invalid electionId or electionType (ac|pc)" });
    }

    const csvFile = req.files?.candidatesCsv?.[0];
    if (!csvFile) {
      return res.status(400).json({ error: "CSV file not provided" });
    }
    const filePath = csvFile.path;

    const results = [];
    const client = await pool.connect();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        let added = 0, failed = 0, skipped = 0;
        const newCandidatesByConstituency = {};
        const constituencyCounters = {}; 

        try {
          await client.query("BEGIN");

          console.log("Fetching initial candidate counters...");
          const uniqueConstituencyIds = [...new Set(results.map(row => parseInt(row.assemblyId || row.parliamentaryId)))].filter(id => !isNaN(id));

          for (const constituencyId of uniqueConstituencyIds) {
             try {
                const countBigInt = await retryBlockchainCall(() => contract.candidateCounter(BigInt(electionId), BigInt(constituencyId)));
                const count = Number(countBigInt); 
                constituencyCounters[constituencyId] = count;
                console.log(`Initial counter for constituency ${constituencyId}: ${count}`);
             } catch (fetchErr) {
                console.error(`Failed to fetch counter for constituency ${constituencyId}: ${fetchErr.message}`);
                 throw new Error(`Could not fetch initial candidate count for constituency ${constituencyId}. Check contract and network.`);
             }
          }
          console.log("Finished fetching counters.");

          console.log(`Processing ${results.length} rows from CSV...`);
          for (const row of results) {
            const constituencyIdRaw = electionType === 'ac' ? row.assemblyId : row.parliamentaryId;
            const constituencyId = parseInt(constituencyIdRaw);
            const { candidateName, party_name, symbol } = row;

            if (isNaN(constituencyId) || !candidateName) {
              console.warn("Skipping row due to missing/invalid constituencyId or candidateName:", row);
              failed++;
              continue;
            }

            if (constituencyCounters[constituencyId] === undefined) {
                 console.warn(`Skipping candidate for constituency ${constituencyId} as initial counter failed.`);
                 failed++;
                 continue;
            }

             const existingCandidate = await client.query(
               `SELECT id FROM candidates WHERE election_id = $1 AND constituency_id = $2 AND candidate_name = $3`,
               [electionId, constituencyId, candidateName]
             );

             if (existingCandidate.rows.length > 0) {
               console.log(`Skipping duplicate candidate in DB: ${candidateName} for constituency ${constituencyId}`);
               skipped++;
               continue;
             }

            const candidateId = constituencyCounters[constituencyId];
            
            // Save ONLY the filename
            const symbolPath = symbol ? path.basename(symbol) : null; 
            if (symbolPath) console.log(`   -> Saving symbol filename for ${candidateName}: ${symbolPath}`);

            await client.query(
              `INSERT INTO candidates (election_id, candidate_id, candidate_name, party_name, symbol, constituency_id) VALUES ($1, $2, $3, $4, $5, $6)`,
              [electionId, candidateId, candidateName, party_name, symbolPath, constituencyId]
            );

            if (!newCandidatesByConstituency[constituencyId]) {
              newCandidatesByConstituency[constituencyId] = [];
            }
            newCandidatesByConstituency[constituencyId].push(candidateName);

            constituencyCounters[constituencyId]++;
            added++;
          }
          console.log("Finished processing CSV rows.");

          // --- AUTOMATIC NOTA INSERTION START ---
          console.log("Checking for NOTA candidates...");
          for (const constituencyId of uniqueConstituencyIds) {
            // Check if NOTA already exists for this election & constituency
            const notaCheck = await client.query(
              `SELECT id FROM candidates WHERE election_id = $1 AND constituency_id = $2 AND party_name = 'NOTA'`,
              [electionId, constituencyId]
            );

            if (notaCheck.rows.length === 0) {
              console.log(`Adding NOTA for constituency ${constituencyId}...`);
              
              const candidateId = constituencyCounters[constituencyId];
              const notaName = "None of the Above";
              const notaParty = "NOTA";
              const notaSymbol = "nota.png"; // Ensure this image is in public/symbols/

              await client.query(
                `INSERT INTO candidates (election_id, candidate_id, candidate_name, party_name, symbol, constituency_id) VALUES ($1, $2, $3, $4, $5, $6)`,
                [electionId, candidateId, notaName, notaParty, notaSymbol, constituencyId]
              );

              // Add to blockchain batch list
              if (!newCandidatesByConstituency[constituencyId]) {
                newCandidatesByConstituency[constituencyId] = [];
              }
              newCandidatesByConstituency[constituencyId].push(notaName);

              constituencyCounters[constituencyId]++;
              added++;
            }
          }
          console.log("Finished NOTA checks.");
          // --- AUTOMATIC NOTA INSERTION END ---

          await client.query("COMMIT");
          console.log("Database changes committed.");

          console.log("Starting sequential blockchain batch transactions...");
          for (const constituencyIdStr of Object.keys(newCandidatesByConstituency)) {
            const names = newCandidatesByConstituency[constituencyIdStr];
            const constituencyId = parseInt(constituencyIdStr);

            if (names.length > 0) {
              console.log(`Sending batch for constituency ${constituencyId} (${names.length} candidates)...`);
              try {
                const tx = await retryBlockchainCall(() =>
                  contract.addCandidates(BigInt(electionId), BigInt(constituencyId), names)
                );
                console.log(`Transaction submitted for constituency ${constituencyId}: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`Batch for constituency ${constituencyId} confirmed. Gas used: ${receipt.gasUsed.toString()}`);
              } catch (blockchainErr) {
                 console.error(`❌ Blockchain transaction FAILED for constituency ${constituencyId}:`, blockchainErr.message);
                 failed += names.length; 
                 added -= names.length; 
              }
            }
          }

          console.log("All blockchain batches processed.");

          res.json({
            message: `✅ Upload complete. Added: ${added}, Skipped (duplicates): ${skipped}, Failed: ${failed}`,
            added, skipped, failed
          });

        } catch (err) {
           console.error("❌ Rolling back database transaction due to error:", err);
           try { await client.query("ROLLBACK"); } catch (rbErr) { console.error("Rollback failed:", rbErr); }

           failed = results.length - skipped; 
           added = 0; 

           console.error("❌ Failed to process candidates:", err.message);
           res.status(500).json({ error: "Failed to process candidates", details: err.message, added, skipped, failed });
        } finally {
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting temp CSV file:", unlinkErr);
            });
          }
          client.release();
          console.log("CSV processing finished, client released.");
        }
      })
      .on("error", (err) => {
        console.error("❌ Error reading CSV stream:", err);
        client.release();
        if (fs.existsSync(filePath)) {
           fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting temp CSV file:", unlinkErr);
           });
        }
        res.status(500).json({ error: "Failed to read or parse CSV file" });
      });
  }
);

module.exports = router;