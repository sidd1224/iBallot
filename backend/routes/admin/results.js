const express = require("express");
const router = express.Router();
const adminAuth = require("../../middleware/adminAuth");
const contract = require("../../blockchain/contract");

// GET /admin/results/:electionId/:assemblyId
router.get("/:electionId/:assemblyId", adminAuth, async (req, res) => {
  try {
    const electionId = parseInt(req.params.electionId);
    const assemblyId = parseInt(req.params.assemblyId);

    if (isNaN(electionId) || isNaN(assemblyId)) {
      return res.status(400).json({ error: "Invalid electionId or assemblyId" });
    }

    const candidateCount = await contract.candidateCounter(electionId, assemblyId);
    if (candidateCount === 0) {
      return res.json({ electionId, assemblyId, results: [], message: "No candidates found." });
    }

    const candidates = [];

    for (let i = 0; i < candidateCount; i++) {
      const candidate = await contract.candidates(electionId, assemblyId, i);
      candidates.push({
        id: i,
        name: candidate.name,
        votes: parseInt(candidate.voteCount.toString())
      });
    }

    // Optional: sort by most votes
    candidates.sort((a, b) => b.votes - a.votes);

    res.json({ electionId, assemblyId, results: candidates });

  } catch (err) {
    console.error("❌ Error fetching results:", err);
    res.status(500).json({ error: "Failed to fetch election results", details: err.message });
  }
});

module.exports = router;
