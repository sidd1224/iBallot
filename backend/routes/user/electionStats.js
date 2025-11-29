const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { contract } = require('../../blockchain/contract');
const { retryBlockchainCall } = require('../../utils/blockchainUtils');
const userAuth = require('../../middleware/userAuth');

/**
 * @route   GET /api/user/election-stats/:electionId
 * @desc    Fetches candidates, live blockchain votes, and calculates winners (handling ties).
 * @access  Private
 */
router.get('/:electionId', userAuth, async (req, res) => {
    const { electionId } = req.params;
    let client;

    try {
        client = await db.connect();

        // 1. Fetch Election Metadata
        const electionRes = await client.query(
            'SELECT name, type, start_time, end_time FROM elections WHERE election_id = $1',
            [electionId]
        );

        if (electionRes.rows.length === 0) {
            return res.status(404).json({ error: "Election not found" });
        }
        const election = electionRes.rows[0];

        // Calculate Status
        const now = new Date();
        const start = new Date(election.start_time);
        const end = new Date(election.end_time);
        let status = 'Upcoming';
        if (now >= start && now <= end) status = 'Live';
        else if (now > end) status = 'Completed';

        // 2. Fetch Candidates from SQL
        // We select specific columns to ensure frontend receives correct keys
        const candidatesRes = await client.query(
            `SELECT 
                candidate_id, 
                candidate_name AS name, 
                party_name AS party, 
                symbol AS symbol_image,
                constituency_id 
             FROM candidates 
             WHERE election_id = $1
             ORDER BY candidate_id ASC`,
            [electionId]
        );

        const candidates = candidatesRes.rows;

        // 3. Fetch Vote Counts from Blockchain
        const stats = await Promise.all(candidates.map(async (candidate) => {
            let voteCount = "0";
            
            try {
                const eID = Number(electionId);
                const cID = Number(candidate.constituency_id) || 0;
                const candID = Number(candidate.candidate_id);

                if (!isNaN(eID) && !isNaN(cID) && !isNaN(candID)) {
                    const votesOnChain = await retryBlockchainCall(() => 
                        contract.getVoteCount(eID, cID, candID)
                    );
                    voteCount = votesOnChain.toString();
                }
            } catch (bcError) {
                console.error(`❌ Blockchain fetch failed for candidate ${candidate.candidate_id}:`, bcError.message);
                voteCount = "0"; 
            }

            return {
                ...candidate,
                party: candidate.party || 'Independent', // Fallback if null
                symbol_image: candidate.symbol_image,
                votes: voteCount
            };
        }));

        // Helper: Calculate Winner (Handles Ties)
        const calculateWinner = (candidatesList) => {
            if (!candidatesList || candidatesList.length === 0) return null;

            // Find the highest vote count
            const maxVotes = Math.max(...candidatesList.map(c => parseInt(c.votes || 0)));
            
            if (maxVotes === 0) return null; // No votes cast yet

            // Find all candidates who have this max vote count
            const leaders = candidatesList.filter(c => parseInt(c.votes || 0) === maxVotes);

            if (leaders.length === 1) {
                return leaders[0]; // Clear winner
            } else {
                // It's a Tie
                return {
                    name: "Tie: " + leaders.map(l => l.name).join(", "),
                    party: "Multiple Parties",
                    votes: maxVotes.toString(),
                    symbol_image: null // No single symbol for tie
                };
            }
        };

        // 4. Calculate Overall Winner
        const totalVotes = stats.reduce((acc, curr) => acc + (parseInt(curr.votes) || 0), 0);
        const overallWinner = calculateWinner(stats);

        // 5. Calculate AC-wise Winners (Grouped by Constituency)
        const candidatesByAC = stats.reduce((acc, curr) => {
            const acId = curr.constituency_id || 0;
            if (!acc[acId]) acc[acId] = [];
            acc[acId].push(curr);
            return acc;
        }, {});

        const assemblyWinners = Object.keys(candidatesByAC).map(acId => {
            const acCandidates = candidatesByAC[acId];
            const winner = calculateWinner(acCandidates);
            
            return {
                ac_id: acId,
                winnerName: winner ? winner.name : "No Votes Yet",
                votes: winner ? winner.votes : "0",
                party: winner ? winner.party : "-"
            };
        });

        res.json({
            success: true,
            election: {
                id: electionId,
                title: election.name,
                status,
                totalVotes
            },
            candidates: stats,
            winner: overallWinner,
            assemblyWinners: assemblyWinners
        });

    } catch (err) {
        console.error("❌ Election Stats Error:", err);
        res.status(500).json({ error: "Failed to load election breakdown." });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;