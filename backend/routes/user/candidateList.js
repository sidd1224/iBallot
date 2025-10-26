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

    // ---!! ADD DIAGNOSTIC CHECK HERE (INSIDE HANDLER) !!---
    console.log(`[candidateList Route - ${electionId}/${constituencyId}] Checking contract object...`);
    if (contract && typeof contract.candidateCounter === 'function') {
        console.log(`[candidateList Route - ${electionId}/${constituencyId}] ✅ candidateCounter IS available before call.`);
    } else {
        console.error(`[candidateList Route - ${electionId}/${constituencyId}] ❌ candidateCounter IS NOT available before call!`);
        // Log details about the contract object if it's problematic
        if (!contract) {
             console.error("   Contract object itself is undefined or null!");
        } else {
             console.error("   Contract object exists, checking interface...");
             if(contract.interface) {
                 console.log("   Functions detected by ethers:", Object.keys(contract.interface.functions));
             } else {
                 console.error("   Contract object has no 'interface' property.");
             }
        }
        return res.status(500).json({ error: "Blockchain contract interaction failed (candidateCounter missing)." });
    }
    // ---!! END DIAGNOSTIC CHECK !!---

    client = await pool.connect();

    // 1. Fetch candidate count from the blockchain
    console.log(`[candidateList Route - ${electionId}/${constituencyId}] Calling contract.candidateCounter...`);
    const countBigInt = await retryBlockchainCall(() =>
        contract.candidateCounter(BigInt(electionId), BigInt(constituencyId))
    );
    const count = Number(countBigInt);
    console.log(`[candidateList Route - ${electionId}/${constituencyId}] Candidate count from contract: ${count}`);


    const candidates = [];
    for (let i = 0; i < count; i++) {
      // 2. Fetch basic candidate data (name) from the blockchain
      const blockchainCandidate = await retryBlockchainCall(() => contract.candidates(BigInt(electionId), BigInt(constituencyId), BigInt(i)));

      // 3. Fetch additional data (party, symbol) from the database
      const dbResult = await client.query(
        `SELECT party_name, symbol
         FROM candidates
         WHERE election_id = $1 AND constituency_id = $2 AND candidate_id = $3`,
        [electionId, constituencyId, i]
      );

      const dbData = dbResult.rows[0] || { party_name: 'N/A', symbol: '' };

      candidates.push({
        id: i,
        name: blockchainCandidate.name,
        party_name: dbData.party_name,
        symbol: dbData.symbol || '',
      });
    }

     console.log(`[candidateList Route - ${electionId}/${constituencyId}] Successfully fetched ${candidates.length} candidates.`);
    res.json({ candidates });

  } catch (err) {
    console.error(`❌ Error fetching candidates for election ${electionIdParam}, constituency ${constituencyIdParam}:`, err);
    res.status(500).json({ error: "Failed to fetch candidates due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;

