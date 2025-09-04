const express = require("express");
const router = express.Router();
const contract = require("../../blockchain/contract");

// GET /user/candidates/:electionId/:assemblyId
router.get("/:electionId/:assemblyId", async (req, res) => {
  try {
    const { electionId, assemblyId } = req.params;

    const count = await contract.candidateCounter(electionId, assemblyId);
    const candidates = [];

    for (let i = 0; i < count; i++) {
      const candidate = await contract.candidates(electionId, assemblyId, i);
      candidates.push({
        id: i,
        name: candidate.name,
        votes: candidate.voteCount.toString(), // optional
      });
    }

    res.json({ candidates });
  } catch (err) {
    console.error("❌ Error fetching candidates:", err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

module.exports = router;
