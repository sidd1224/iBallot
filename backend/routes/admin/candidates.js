// backend/routes/admin/candidates.js
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const pool = require("../../database/db");
// --- FIX: Import the contract instance directly ---
const { contract } = require("../../blockchain/contract");
// Remove JsonRpcProvider and Wallet imports as they are no longer needed here
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

require("dotenv").config();

// Multer storage configuration (remains the same)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";
    if (file.fieldname === 'candidatesCsv') {
      uploadPath = 'uploads/';
    } else if (file.fieldname === 'symbols') {
      uploadPath = 'public/symbols/';
    }
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'candidatesCsv') {
      cb(null, Date.now() + '-' + file.originalname);
    } else if (file.fieldname === 'symbols') {
      // Use the original filename for symbols to match CSV references
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ storage: storage });

// Merged /upload route
router.post(
  "/upload",
  adminAuth,
  upload.fields([
    { name: 'candidatesCsv', maxCount: 1 },
    { name: 'symbols', maxCount: 100 } // Allow uploading multiple symbol files
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

    // --- FIX: Remove redundant provider/signer creation ---
    // const provider = new JsonRpcProvider(process.env.RPC_URL);
    // const signer = contract.connect(new Wallet(process.env.RELAYER_PRIVATE_KEY, provider));
    // We will use the imported 'contract' directly as it's already connected to the admin wallet

    const results = [];
    const client = await pool.connect();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        let added = 0, failed = 0, skipped = 0;
        const newCandidatesByConstituency = {};
        const constituencyCounters = {}; // Keep track of the next ID for each constituency

        try {
          await client.query("BEGIN");

          // 1. Pre-fetch starting candidate counters from the blockchain ONCE per constituency
          console.log("Fetching initial candidate counters...");
          const uniqueConstituencyIds = [...new Set(results.map(row => parseInt(row.assemblyId || row.parliamentaryId)))].filter(id => !isNaN(id));

          for (const constituencyId of uniqueConstituencyIds) {
             try {
                const countBigInt = await retryBlockchainCall(() => contract.candidateCounter(electionId, constituencyId));
                const count = Number(countBigInt); // Convert BigInt to Number
                constituencyCounters[constituencyId] = count;
                console.log(`Initial counter for constituency ${constituencyId}: ${count}`);
             } catch (fetchErr) {
                console.error(`Failed to fetch counter for constituency ${constituencyId}: ${fetchErr.message}`);
                // Handle error - maybe skip this constituency or fail the whole batch?
                // For now, let's throw to indicate a critical setup failure.
                 throw new Error(`Could not fetch initial candidate count for constituency ${constituencyId}. Check contract and network.`);
             }
          }
          console.log("Finished fetching counters.");


          // 2. Process CSV, validate, and insert all candidates into DB transactionally
          console.log(`Processing ${results.length} rows from CSV...`);
          for (const row of results) {
            // Determine constituency ID based on election type
            const constituencyIdRaw = electionType === 'ac' ? row.assemblyId : row.parliamentaryId;
            const constituencyId = parseInt(constituencyIdRaw);
            const { candidateName, party_name, symbol } = row;

            // Basic validation
            if (isNaN(constituencyId) || !candidateName) {
              console.warn("Skipping row due to missing/invalid constituencyId or candidateName:", row);
              failed++;
              continue;
            }

            // Check if this constituency counter was fetched successfully
            if (constituencyCounters[constituencyId] === undefined) {
                 console.warn(`Skipping candidate for constituency ${constituencyId} as initial counter failed.`);
                 failed++;
                 continue;
            }

            // Check if candidate already exists in the database FOR THIS BATCH (optional but good practice)
            // Or rely on DB constraints if defined. For simplicity, we check first.
             const existingCandidate = await client.query(
               `SELECT id FROM candidates WHERE election_id = $1 AND constituency_id = $2 AND candidate_name = $3`,
               [electionId, constituencyId, candidateName]
             );

             if (existingCandidate.rows.length > 0) {
               console.log(`Skipping duplicate candidate in DB: ${candidateName} for constituency ${constituencyId}`);
               skipped++;
               continue;
             }

            // Assign the next available candidate ID for this constituency
            const candidateId = constituencyCounters[constituencyId];
            const symbolPath = symbol ? `/symbols/${path.basename(symbol)}` : null; // Use basename for safety

            // Insert into DB
            await client.query(
              `INSERT INTO candidates (election_id, candidate_id, candidate_name, party_name, symbol, constituency_id) VALUES ($1, $2, $3, $4, $5, $6)`,
              [electionId, candidateId, candidateName, party_name, symbolPath, constituencyId]
            );

            // Group candidates by constituency for batch blockchain transaction
            if (!newCandidatesByConstituency[constituencyId]) {
              newCandidatesByConstituency[constituencyId] = [];
            }
            newCandidatesByConstituency[constituencyId].push(candidateName);

            // Increment the counter for the next candidate in this constituency
            constituencyCounters[constituencyId]++;
            added++;
          }
          console.log("Finished processing CSV rows.");

          // 3. Commit DB changes *before* sending blockchain transactions
          await client.query("COMMIT");
          console.log("Database changes committed.");

          // 4. Send batch transactions to blockchain sequentially per constituency
          console.log("Starting sequential blockchain batch transactions...");
          for (const constituencyIdStr of Object.keys(newCandidatesByConstituency)) {
            const names = newCandidatesByConstituency[constituencyIdStr];
            const constituencyId = parseInt(constituencyIdStr);

            if (names.length > 0) {
              console.log(`Sending batch for constituency ${constituencyId} (${names.length} candidates)...`);
              try {
                // --- FIX: Use the imported 'contract' directly ---
                const tx = await retryBlockchainCall(() =>
                  contract.addCandidates(electionId, constituencyId, names)
                );
                console.log(`Transaction submitted for constituency ${constituencyId}: ${tx.hash}`);
                // Wait for THIS transaction to be mined before starting the next loop iteration
                const receipt = await tx.wait();
                console.log(`Batch for constituency ${constituencyId} confirmed. Gas used: ${receipt.gasUsed.toString()}`);
              } catch (blockchainErr) {
                 console.error(`❌ Blockchain transaction FAILED for constituency ${constituencyId}:`, blockchainErr.message);
                 // Decide how to handle: maybe revert DB changes? Or just report error?
                 // For now, we'll just report and continue, but mark as failed.
                 failed += names.length; // Assume all candidates in this failed batch didn't make it to the contract
                 added -= names.length;  // Adjust the 'added' count
                 // Throwing here would stop processing subsequent constituencies
                 // throw new Error(`Blockchain transaction failed for constituency ${constituencyId}`);
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
           // Ensure rollback happens if any error occurs before/during DB commit OR during blockchain phase
           try { await client.query("ROLLBACK"); } catch (rbErr) { console.error("Rollback failed:", rbErr); }

           // Adjust counts if error happened after DB commit but during blockchain phase
           // Note: This logic might need refinement depending on exactly when the error occurred.
           // If the error was *before* COMMIT, added should be 0. If *after* COMMIT but *during* blockchain,
           // 'added' reflects DB additions, but 'failed' should capture blockchain failures.
           // The current logic assumes failure means all non-skipped rows failed if the process aborts.
           failed = results.length - skipped; // A simplification for reporting
           added = 0; // Since we rolled back or failed blockchain update

           console.error("❌ Failed to process candidates:", err.message);
           res.status(500).json({ error: "Failed to process candidates", details: err.message, added, skipped, failed });
        } finally {
          // Clean up the uploaded CSV file
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
        // Handle errors during CSV parsing itself
        console.error("❌ Error reading CSV stream:", err);
        client.release(); // Ensure client is released even on stream error
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

