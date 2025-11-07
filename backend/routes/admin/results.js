const express = require("express");
const router = express.Router();
const pool = require("../../database/db"); // Use the pooled connection
const { contract } = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");
const adminAuth = require("../../middleware/adminAuth");

// Helper function to check election status from the contract
// ✅ FIXED: Helper function to get correct election status
async function getElectionStatus(electionId) {
  let client;
  try {
    client = await pool.connect();

    // 1️⃣ Get start/end times from the database first
    const dbRes = await client.query(
      "SELECT start_time, end_time FROM elections WHERE election_id = $1",
      [electionId]
    );

    if (dbRes.rows.length === 0) {
      throw new Error("Election not found in DB");
    }

    const dbStart = Math.floor(new Date(dbRes.rows[0].start_time).getTime() / 1000);
    const dbEnd = Math.floor(new Date(dbRes.rows[0].end_time).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    // 2️⃣ Get the latest election ID (most recently created)
    const latestElection = await client.query(
      "SELECT election_id FROM elections ORDER BY start_time DESC LIMIT 1"
    );
    const latestId = latestElection.rows[0]?.election_id;

    // Default to DB times
    let startTime = dbStart;
    let endTime = dbEnd;

    // 3️⃣ Only fetch blockchain times for the currently active/latest election
    if (parseInt(electionId) === parseInt(latestId)) {
      try {
        console.log(`[getElectionStatus ${electionId}] Using blockchain times (latest election).`);
        const startTimeBigInt = await retryBlockchainCall(() => contract.startTime());
        const endTimeBigInt = await retryBlockchainCall(() => contract.endTime());
        startTime = Number(startTimeBigInt);
        endTime = Number(endTimeBigInt);
      } catch (bcErr) {
        console.warn(`[getElectionStatus ${electionId}] Blockchain time fetch failed, falling back to DB times.`);
      }
    } else {
      console.log(`[getElectionStatus ${electionId}] Using DB times (past election).`);
    }

    // 4️⃣ Determine status
    const isStarted = now >= startTime;
    const isOver = now > endTime;

    console.log(`[getElectionStatus ${electionId}] Final status - Started: ${isStarted}, Over: ${isOver}`);

    return {
      isElectionStarted: isStarted,
      isElectionOver: isOver,
      startTime,
      endTime
    };

  } catch (error) {
    console.error(`[getElectionStatus ${electionId}] ${error.message}`);
    throw new Error("Failed to fetch election status.");
  } finally {
    if (client) client.release();
  }
}


// GET /api/admin/results/summary/:electionId
router.get("/summary/:electionId", adminAuth, async (req, res) => {
  const { electionId } = req.params;
  let client;

  try {
    client = await pool.connect();

    // 1. Get election details from DB (including saved winner)
    const electionRes = await client.query("SELECT * FROM elections WHERE election_id = $1", [electionId]);
    if (electionRes.rows.length === 0) {
      return res.status(404).json({ error: "Election not found." });
    }
    const election = electionRes.rows[0];
    const enabledConstituencies = election.enabled_constituencies || [];
    const savedWinnerName = election.winner_party_name; // Winner from previous tie-break

    // 2. Get election status from Blockchain
    // **Point 1:** Fetch current status from blockchain
    const { isElectionOver, isElectionStarted, startTime, endTime } = await getElectionStatus(electionId);

    // 3. **Point 3:** Count eligible voters ONLY from eci_admin_data
    let totalVoters = 0;
    if (enabledConstituencies.length > 0) {
        const eligibleVotersQuery = `
          SELECT COUNT(DISTINCT uid_hash)
          FROM eci_admin_data
          WHERE ac_id = ANY($1::int[]) OR pc_id = ANY($1::int[])
        `;
        const eligibleVotersRes = await client.query(eligibleVotersQuery, [enabledConstituencies]);
        totalVoters = parseInt(eligibleVotersRes.rows[0].count, 10);
        console.log(`[Summary ${electionId}] Total eligible (ECI): ${totalVoters}`);
    } else {
        console.warn(`[Summary ${electionId}] No enabled constituencies. Total eligible voters set to 0.`);
    }

    // 4. Get total votes cast from Blockchain
    let votersVoted = 0;
     if (isElectionStarted || isElectionOver) { // Fetch if started or over
        try {
            const votersVotedBigInt = await retryBlockchainCall(() => contract.getTotalVotes(electionId));
            votersVoted = parseInt(votersVotedBigInt.toString(), 10);
            console.log(`[Summary ${electionId}] Total votes cast (Contract): ${votersVoted}`);
        } catch (turnoutError) {
             console.error(`[Summary ${electionId}] Failed to get total votes: ${turnoutError.message}`);
             throw new Error(`Could not fetch voter turnout from blockchain for election ${electionId}.`);
        }
     }

    // 5. Calculate Winner/Tie Status if Election is Over
    let winningParty = null;
    let tiedParties = [];
    let tieDetected = false;
    let aggregatedVoteSum = 0;

    if (isElectionOver) {
        console.log(`[Summary ${electionId}] Election is over. Calculating winner status...`);

        // Get candidates only if needed for calculation
        let allCandidates = [];
        if (!savedWinnerName && enabledConstituencies.length > 0) { // Only fetch if no winner saved & constituencies exist
            const candidatesRes = await client.query(
              `SELECT candidate_id, constituency_id, party_name
               FROM candidates
               WHERE election_id = $1 AND constituency_id = ANY($2::int[])`,
              [electionId, enabledConstituencies]
            );
            allCandidates = candidatesRes.rows;
        } else if (savedWinnerName) {
             console.log(`[Summary ${electionId}] Winner already saved: ${savedWinnerName}. Skipping vote aggregation.`);
        } else {
             console.warn(`[Summary ${electionId}] Cannot calculate winner - no constituencies enabled.`);
        }

        // Proceed if we need to calculate based on votes
        if (!savedWinnerName && allCandidates.length > 0) {
            console.log(`[Summary ${electionId}] Fetching individual vote counts for ${allCandidates.length} candidates...`);
            // Fetch vote counts (can be slow, consider alternative if performance issues)
            const voteCountsPromises = allCandidates.map(async (c) => {
                try {
                    const countBigInt = await retryBlockchainCall(() =>
                        contract.getVoteCount(BigInt(electionId), BigInt(c.constituency_id), BigInt(c.candidate_id))
                    );
                    return { party_name: c.party_name, votes: Number(countBigInt) };
                } catch (err) {
                    console.error(`[Summary ${electionId}] Failed vote count for cand ${c.candidate_id}: ${err.message}`);
                    return { party_name: c.party_name, votes: 0 };
                }
            });
            const allVoteCounts = await Promise.all(voteCountsPromises);
            console.log(`[Summary ${electionId}] Finished fetching vote counts.`);

            // Aggregate votes
            const partyVotes = allVoteCounts.reduce((acc, current) => {
                if (current.party_name) {
                    acc[current.party_name] = (acc[current.party_name] || 0) + current.votes;
                }
                return acc;
            }, {});
            aggregatedVoteSum = Object.values(partyVotes).reduce((sum, votes) => sum + votes, 0);
             console.log(`[Summary ${electionId}] Aggregated party votes:`, partyVotes, `Total: ${aggregatedVoteSum}`);
             if (aggregatedVoteSum !== votersVoted) {
                 console.warn(`[Summary ${electionId}] WARNING: Aggregated sum (${aggregatedVoteSum}) != getTotalVotes (${votersVoted}). Using aggregation for winner.`);
             }

            // Determine winner/tie from aggregation
            const sortedParties = Object.entries(partyVotes)
                .map(([name, votes]) => ({ name, votes }))
                .sort((a, b) => b.votes - a.votes);

            if (sortedParties.length > 0) {
                const maxVotes = sortedParties[0].votes;
                tiedParties = sortedParties.filter(p => p.votes === maxVotes);

                if (tiedParties.length === 1) {
                    winningParty = tiedParties[0]; // Clear winner
                    tieDetected = false;
                    console.log(`[Summary ${electionId}] Winner determined: ${winningParty.name} (${winningParty.votes} votes).`);
                } else if (tiedParties.length > 1) {
                     // **Point 2 & 4:** Tie detected (even at 0 votes), no saved winner yet
                    tieDetected = true;
                    winningParty = null;
                    console.log(`[Summary ${electionId}] Tie detected (Votes: ${maxVotes}) between:`, tiedParties.map(p => p.name));
                }
            }
        }

         // **Point 4:** Handle saved winner case separately
         if (savedWinnerName) {
              winningParty = { name: savedWinnerName, votes: "N/A (Draw)" }; // Votes maybe unavailable/irrelevant after draw
              tieDetected = false; // Tie is resolved
              console.log(`[Summary ${electionId}] Using previously saved winner: ${savedWinnerName}`);
         }
         // Handle no-winner scenario only if no tie was detected and no winner saved/calculated
         else if (!winningParty && !tieDetected) {
             if (aggregatedVoteSum === 0 && allCandidates.length > 0) {
                 winningParty = { name: "N/A (No votes cast)", votes: 0 };
             } else {
                 winningParty = { name: "N/A", votes: 0 };
             }
             console.log(`[Summary ${electionId}] Setting winner to: ${winningParty.name}`);
        }
    } else {
         console.log(`[Summary ${electionId}] Election not over yet. No winner calculation.`);
    }

    // 6. Send the final summary object
    res.json({
      election: {
        ...election,
        startTime, // Blockchain time
        endTime    // Blockchain time
      },
      isElectionStarted, // Status based on blockchain times
      isElectionOver,   // Status based on blockchain times
      totalVoters,      // Count from ECI data
      votersVoted,      // Count from contract.getTotalVotes
      winningParty,     // Could be null if tieDetected is true AND no winner saved
      tieDetected,      // True if tie exists AND no winner saved
      tiedParties       // List of parties tied for the lead (if tieDetected)
    });

  } catch (error) {
    console.error(`❌ Error in /summary/${electionId}: ${error.message}`);
    res.status(500).json({ error: "Internal server error fetching summary.", details: error.message });
  } finally {
      if (client) client.release();
  }
});


// GET /api/admin/results/:electionId/:constituencyId
// (No changes needed in this route based on the 4 points)
router.get("/:electionId/:constituencyId", adminAuth, async (req, res) => {
  const { electionId, constituencyId } = req.params;
  let client;

  try {
     client = await pool.connect();

    const { isElectionOver, isElectionStarted } = await getElectionStatus(electionId);

    const candidatesRes = await client.query(
      `SELECT candidate_id, candidate_name as name, party_name, symbol
       FROM candidates
       WHERE election_id = $1 AND constituency_id = $2`,
      [electionId, constituencyId]
    );

    if (candidatesRes.rows.length === 0) {
       console.log(`[Constituency ${constituencyId}] No candidates found for election ${electionId}`);
      return res.json({ isElectionOver, isElectionStarted, results: [] });
    }
    const candidates = candidatesRes.rows;

    let results = [];
     if (isElectionStarted || isElectionOver) {
        const voteCountPromises = candidates.map(async (candidate) => {
          try {
            const voteCountBigInt = await retryBlockchainCall(() =>
              contract.getVoteCount(BigInt(electionId), BigInt(constituencyId), BigInt(candidate.candidate_id))
            );
            return {
              id: candidate.candidate_id, name: candidate.name, party_name: candidate.party_name,
              symbol: candidate.symbol, votes: parseInt(voteCountBigInt.toString(), 10),
            };
          } catch (voteCountErr) {
            console.warn(`[Constituency ${constituencyId}] Could not get vote count for candidate ${candidate.candidate_id}: ${voteCountErr.message}`);
            return { id: candidate.candidate_id, name: candidate.name, party_name: candidate.party_name, symbol: candidate.symbol, votes: 0 };
          }
        });
        results = await Promise.all(voteCountPromises);
     } else {
         results = candidates.map(c => ({ ...c, votes: 0 }));
     }

    results.sort((a, b) => b.votes - a.votes);
    res.json({ isElectionOver, isElectionStarted, results });

  } catch (error) {
    console.error(`❌ Error in /results/${electionId}/${constituencyId}: ${error.message}`);
    res.status(500).json({ error: "Internal server error fetching constituency results.", details: error.message });
  } finally {
      if (client) client.release();
  }
});

// POST /api/admin/results/break-tie
// (No changes needed here, it allows breaking 0-0 ties and saves winner)
router.post("/break-tie", adminAuth, async (req, res) => {
    const { electionId, tiedParties } = req.body;
    let client;

    console.log(`[Break-Tie ${electionId}] Received request. Tied parties:`, tiedParties);

    if (!electionId || !Array.isArray(tiedParties) || tiedParties.length < 2) {
        return res.status(400).json({ error: "Invalid request for tie-breaking." });
    }

    try {
        const randomIndex = Math.floor(Math.random() * tiedParties.length);
        const winningParty = tiedParties[randomIndex];
        console.log(`[Break-Tie ${electionId}] Draw winner: ${winningParty.name}`);

        client = await pool.connect();
        try {
            // Persist winner
            await client.query("UPDATE elections SET winner_party_name = $1 WHERE election_id = $2", [winningParty.name, electionId]);
            console.log(`[Break-Tie ${electionId}] Persisted winner ${winningParty.name} to DB.`);
        } finally {
            if (client) client.release();
        }

        res.json({ message: `Draw of lots complete. Winner: ${winningParty.name}`, winningParty });

    } catch (error) {
        console.error(`[Break-Tie ${electionId}] Error: ${error.message}`);
        if (client) client.release();
        res.status(500).json({ error: "Internal server error during tie-breaking." });
    }
});

module.exports = router;

