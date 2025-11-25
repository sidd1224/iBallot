const express = require("express");
const router = express.Router();
// Import the whole module
const blockchain = require("../../blockchain/contract");
// Get the contract instance exported from contract.js
const contract = blockchain.contract;
const pool = require("../../database/db");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

// GET /api/candidates/:electionId/:constituencyId
router.get("/:electionId/:constituencyId", async (req, res) => {
  let client;
  const { electionId: electionIdParam, constituencyId: constituencyIdParam } = req.params; // Get params once

  try {
    const electionId = parseInt(electionIdParam);
    const constituencyId = parseInt(constituencyIdParam);

    if (isNaN(electionId) || isNaN(constituencyId)) {
      return res.status(400).json({ error: "Election ID and Constituency ID must be valid numbers." });
    }

    client = await pool.connect();

    // 1. Fetch candidate count from the blockchain
    console.log(`[candidateList Route - ${electionId}/${constituencyId}] Calling contract.candidateCounter...`);
    const countBigInt = await retryBlockchainCall(() =>
        contract.candidateCounter(BigInt(electionId), BigInt(constituencyId))
    );
    const count = Number(countBigInt);
    console.log(`[candidateList Route - ${electionId}/${constituencyId}] Candidate count from contract: ${count}`);

    // 2. Optimization: Fetch ALL valid DB candidates for this constituency at once
    // This avoids making N database queries inside the loop
    const dbResult = await client.query(
      `SELECT candidate_id, candidate_name, party_name, symbol
       FROM candidates
       WHERE election_id = $1 AND constituency_id = $2`,
      [electionId, constituencyId]
    );

    // Create a lookup map for faster access: { candidate_id: candidateData }
    const dbCandidatesMap = {};
    dbResult.rows.forEach(row => {
        dbCandidatesMap[row.candidate_id] = row;
    });

    const candidates = [];
    for (let i = 0; i < count; i++) {
      // 3. Check if this blockchain index exists in our Database
      const dbData = dbCandidatesMap[i];

      if (!dbData) {
        // ⚠️ If not in DB, it's a "Ghost" candidate (exists on chain, but not in current DB).
        // We SKIP it to prevent "N/A" duplicates in the UI.
        console.warn(`[candidateList] Skipping ghost candidate ID ${i} (not found in DB).`);
        continue;
      }

      // 4. Fetch name from blockchain to ensure on-chain validity
      // (Optional: You could trust dbData.candidate_name for speed, but fetching confirms sync)
      let blockchainName = dbData.candidate_name; 
      try {
          const blockchainCandidate = await retryBlockchainCall(() => contract.candidates(BigInt(electionId), BigInt(constituencyId), BigInt(i)));
          blockchainName = blockchainCandidate.name;
      } catch (bcError) {
          console.warn(`[candidateList] Failed to fetch blockchain details for ID ${i}, using DB name.`);
      }

      candidates.push({
        id: i,
        name: blockchainName,
        party_name: dbData.party_name,
        symbol: dbData.symbol || '',
      });
    }

     console.log(`[candidateList Route - ${electionId}/${constituencyId}] Returning ${candidates.length} valid candidates.`);
    res.json({ candidates });

  } catch (err) {
    console.error(`❌ Error fetching candidates for election ${electionIdParam}, constituency ${constituencyIdParam}:`, err);
    res.status(500).json({ error: "Failed to fetch candidates due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;