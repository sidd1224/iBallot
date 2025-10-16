const express = require("express");
const router = express.Router();
const contract = require("../../blockchain/contract");
const pool = require("../../database/db");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

// GET /api/candidates/:electionId/:constituencyId
router.get("/:electionId/:constituencyId", async (req, res) => {
  let client;
  try {
    const electionId = parseInt(req.params.electionId);
    const constituencyId = parseInt(req.params.constituencyId);

    if (isNaN(electionId) || isNaN(constituencyId)) {
      return res.status(400).json({ error: "Election ID and Constituency ID must be valid numbers." });
    }

    client = await pool.connect();

    // 1. Fetch candidate count from the blockchain
    const count = await retryBlockchainCall(() => contract.candidateCounter(electionId, constituencyId));
    
    const candidates = [];
    for (let i = 0; i < count; i++) {
      // 2. Fetch basic candidate data (name) from the blockchain
      const blockchainCandidate = await retryBlockchainCall(() => contract.candidates(electionId, constituencyId, i));
      
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
        symbol: dbData.symbol,
      });
    }

    res.json({ candidates });

  } catch (err) {
    console.error("❌ Error fetching candidates:", err.message);
    res.status(500).json({ error: "Failed to fetch candidates" });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;