const express = require("express");
const router = express.Router();
const contract = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils"); // Import the helper

// GET /candidates/:electionId/:assemblyId
// Note: "assemblyId" in the route now refers to the numeric constituency ID (ac_id or pc_id)
router.get("/:electionId/:assemblyId", async (req, res) => {
  try {
    // --- UPDATED: Parse URL parameters from strings to integers ---
    const electionId = parseInt(req.params.electionId);
    const assemblyId = parseInt(req.params.assemblyId);

    // Validate that the conversion was successful
    if (isNaN(electionId) || isNaN(assemblyId)) {
      return res.status(400).json({ error: "Election ID and Assembly ID must be valid numbers." });
    }

    // --- UPDATED: Wrap blockchain call with retry logic ---
    const count = await retryBlockchainCall(() => contract.candidateCounter(electionId, assemblyId));
    
    const candidates = [];
    for (let i = 0; i < count; i++) {
      // --- UPDATED: Wrap blockchain call with retry logic ---
      const candidate = await retryBlockchainCall(() => contract.candidates(electionId, assemblyId, i));
      candidates.push({
        id: i,
        name: candidate.name,
        // The frontend doesn't need the vote count on this page, so it can be omitted
        // votes: candidate.voteCount.toString(), 
      });
    }

    res.json({ candidates });
  } catch (err) {
    console.error("❌ Error fetching candidates:", err.message);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

module.exports = router;

