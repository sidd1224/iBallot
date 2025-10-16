// backend/routes/admin/results.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto"); // Import crypto for the lottery
const adminAuth = require("../../middleware/adminAuth");
const contract = require("../../blockchain/contract");
const pool = require("../../database/db");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

// --- UPDATED: Route for overall election summary and results ---
router.get("/summary/:electionId", adminAuth, async (req, res) => {
  let client;
  try {
    const electionId = parseInt(req.params.electionId);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: "Invalid Election ID" });
    }

    client = await pool.connect();

    // 1. Get election details from DB
    const electionResult = await client.query("SELECT * FROM elections WHERE election_id = $1", [electionId]);
    if (electionResult.rows.length === 0) {
      return res.status(404).json({ error: "Election not found." });
    }
    const election = electionResult.rows[0];
    const isElectionOver = new Date(election.end_time) < new Date();

    // 2. Calculate voter turnout (no changes here)
    const constituencyList = election.enabled_constituencies || [];
    let eligibleVotersQuery;
    if (constituencyList.length > 0) {
      eligibleVotersQuery = await client.query(
        "SELECT uid_hash FROM eci_admin_data WHERE ac_id = ANY($1::int[]) OR pc_id = ANY($1::int[])",
        [constituencyList]
      );
    } else {
      eligibleVotersQuery = await client.query("SELECT uid_hash FROM users");
    }
    const eligibleVoters = eligibleVotersQuery.rows;
    const totalVoters = eligibleVoters.length;

    let votersVoted = 0;
    for (const voter of eligibleVoters) {
      const voterHash = "0x" + voter.uid_hash;
      const hasVoted = await retryBlockchainCall(() => contract.hasVoted(electionId, voterHash));
      if (hasVoted) {
        votersVoted++;
      }
    }

    // 3. If election is over, calculate detailed results
    if (isElectionOver) {
      // If a winner has already been decided by a tie-breaker, just return it.
      if (election.winner_party_name) {
        return res.json({
          election,
          isElectionOver,
          totalVoters,
          votersVoted,
          winningParty: { name: election.winner_party_name, votes: "N/A - Decided by Draw" },
        });
      }

      const partyVotes = {};
      const allCandidatesQuery = await client.query(
        "SELECT * FROM candidates WHERE election_id = $1",
        [electionId]
      );

      for (const candidate of allCandidatesQuery.rows) {
        const bcCandidate = await retryBlockchainCall(() => 
          contract.candidates(candidate.election_id, candidate.constituency_id, candidate.candidate_id)
        );
        const voteCount = parseInt(bcCandidate.voteCount.toString());
        if (candidate.party_name) {
          partyVotes[candidate.party_name] = (partyVotes[candidate.party_name] || 0) + voteCount;
        }
      }

      // --- NEW: Tie Detection Logic ---
      const maxVotes = Math.max(...Object.values(partyVotes));
      const tiedParties = Object.keys(partyVotes).filter(party => partyVotes[party] === maxVotes);

      if (tiedParties.length === 1) {
        // Clear winner
        res.json({ 
          election, isElectionOver, totalVoters, votersVoted,
          winningParty: { name: tiedParties[0], votes: maxVotes },
          partyVotes
        });
      } else if (tiedParties.length > 1) {
        // It's a tie
        res.json({
          election, isElectionOver, totalVoters, votersVoted,
          tieDetected: true,
          tiedParties: tiedParties.map(party => ({ name: party, votes: maxVotes })),
          partyVotes
        });
      } else {
         // No votes cast
         res.json({ 
          election, isElectionOver, totalVoters, votersVoted,
          winningParty: { name: 'No votes cast', votes: 0 }
        });
      }
    } else {
      // If election is still active, only return turnout data
      res.json({ 
        election, isElectionOver, totalVoters, votersVoted 
      });
    }

  } catch (err) {
    console.error("❌ Error fetching results summary:", err);
    res.status(500).json({ error: "Failed to fetch results summary", details: err.message });
  } finally {
    if (client) client.release();
  }
});

// --- NEW: Route to break a tie ---
router.post("/break-tie", adminAuth, async (req, res) => {
  const { electionId, tiedParties } = req.body;
  if (!electionId || !tiedParties || tiedParties.length < 2) {
    return res.status(400).json({ error: "Missing required fields for tie-breaker." });
  }

  let client;
  try {
    // Perform the "draw of lots"
    const winnerIndex = crypto.randomInt(0, tiedParties.length);
    const winner = tiedParties[winnerIndex];

    client = await pool.connect();
    // Persist the winner to the database
    await client.query(
      "UPDATE elections SET winner_party_name = $1 WHERE election_id = $2",
      [winner.name, electionId]
    );

    res.json({ success: true, message: "Tie-breaker successful!", winningParty: winner });

  } catch (err) {
    console.error("❌ Error breaking tie:", err);
    res.status(500).json({ error: "Failed to break tie", details: err.message });
  } finally {
    if (client) client.release();
  }
});




// --- Existing route for constituency-specific results ---
router.get("/:electionId/:constituencyId", adminAuth, async (req, res) => {
  let client;
  try {
    const electionId = parseInt(req.params.electionId);
    const constituencyId = parseInt(req.params.constituencyId);

    if (isNaN(electionId) || isNaN(constituencyId)) {
      return res.status(400).json({ error: "Invalid electionId or constituencyId" });
    }

    client = await pool.connect();

    const candidateCount = await retryBlockchainCall(() => contract.candidateCounter(electionId, constituencyId));
    if (candidateCount === 0) {
      return res.json({ electionId, constituencyId, results: [], message: "No candidates found." });
    }

    const candidates = [];
    for (let i = 0; i < candidateCount; i++) {
      const blockchainCandidate = await retryBlockchainCall(() => contract.candidates(electionId, constituencyId, i));
      const dbResult = await client.query(
        `SELECT party_name, symbol FROM candidates WHERE election_id = $1 AND constituency_id = $2 AND candidate_id = $3`,
        [electionId, constituencyId, i]
      );
      const dbData = dbResult.rows[0] || { party_name: 'N/A', symbol: '' };

      candidates.push({
        id: i,
        name: blockchainCandidate.name,
        votes: parseInt(blockchainCandidate.voteCount.toString()),
        party_name: dbData.party_name,
        symbol: dbData.symbol
      });
    }

    candidates.sort((a, b) => b.votes - a.votes);
    res.json({ electionId, constituencyId, results: candidates });

  } catch (err) {
    console.error("❌ Error fetching results:", err);
    res.status(500).json({ error: "Failed to fetch election results", details: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;