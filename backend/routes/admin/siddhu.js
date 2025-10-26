// backend/routes/admin/results.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const adminAuth = require("../../middleware/adminAuth");
const contract = require("../../blockchain/contract");
const pool = require("../../database/db");
const { retryBlockchainCall } = require("../../utils/blockchainUtils"); // Assuming this utility exists
const { JsonRpcProvider } = require("ethers"); // Import provider if not available globally

// --- Configuration ---
const BATCH_SIZE = 10; // Number of blocks to query per RPC call. Adjust based on your provider's actual limit (10 was just an example in the error). Start reasonably high (e.g., 1000) and lower if needed.

/**
 * Helper function to determine the block range for event queries.
 * @param {object} election - The election object from the database.
 * @param {number|string} election_id - The election ID.
 * @param {JsonRpcProvider} provider - Ethers provider instance.
 * @returns {Promise<{ fromBlock: number, toBlock: number }>} - Returns numeric start and end blocks.
 */
async function getNumericBlockRange(election, election_id, provider) {
    let fromBlock = election.start_block ? Number(election.start_block) : 0;
    let toBlockRaw = election.end_block ? Number(election.end_block) : 'latest';

    // Fallback reads from contract if DB is null
    if (fromBlock === 0) {
        try {
            const contractStartBlock = await contract.electionStartBlock(election_id);
            if (contractStartBlock > 0) fromBlock = Number(contractStartBlock);
        } catch (fbErr) { console.warn(`Could not fetch startBlock from contract: ${fbErr.message}`); }
    }
    if (toBlockRaw === 'latest') {
        try {
             // Only fetch contract end block if election time has passed
             if (new Date(election.end_time) < new Date()){
                const contractEndBlock = await contract.electionEndBlock(election_id);
                if (contractEndBlock > 0) toBlockRaw = Number(contractEndBlock);
             }
             // If still 'latest', get the current block number
             if (toBlockRaw === 'latest'){
                toBlockRaw = await provider.getBlockNumber();
             }
        } catch (tbErr) {
             console.warn(`Could not fetch endBlock/latest block: ${tbErr.message}`);
             // Fallback safely to current block number if contract read fails
             toBlockRaw = await provider.getBlockNumber();
        }
    }

    // Ensure fromBlock is never negative
    if (fromBlock < 0) fromBlock = 0;
    // Ensure toBlock is a number
    let toBlock = (toBlockRaw === 'latest') ? await provider.getBlockNumber() : Number(toBlockRaw);

    // Sanity check
    if (fromBlock > toBlock) {
        console.warn(`Warning: Election ${election_id} has start_block (${fromBlock}) after end_block (${toBlock}). Querying only block ${fromBlock}.`);
        toBlock = fromBlock; // Query at least the start block
    }

    return { fromBlock, toBlock };
}


/**
 * Fetches events in batches to avoid RPC limits.
 * @param {ethers.Contract} contractInstance - The ethers contract instance.
 * @param {ethers.EventFilter} filter - The event filter.
 * @param {number} startBlock - The starting block number.
 * @param {number} endBlock - The ending block number.
 * @param {number} batchSize - Max number of blocks per query.
 * @returns {Promise<ethers.EventLog[]>} - Array of fetched events.
 */
async function getEventsInBatches(contractInstance, filter, startBlock, endBlock, batchSize) {
    let allEvents = [];
    console.log(`Fetching events from ${startBlock} to ${endBlock} in batches of ${batchSize}...`);
    for (let currentBlock = startBlock; currentBlock <= endBlock; currentBlock += batchSize) {
        const batchEndBlock = Math.min(currentBlock + batchSize - 1, endBlock);
        console.log(`  Querying batch: ${currentBlock} to ${batchEndBlock}`);
        try {
            const batchEvents = await retryBlockchainCall(() =>
                contractInstance.queryFilter(filter, currentBlock, batchEndBlock)
            );
            allEvents = allEvents.concat(batchEvents);
            console.log(`    Found ${batchEvents.length} events in batch.`);
        } catch (batchError) {
             console.error(`❌ Error fetching event batch (${currentBlock}-${batchEndBlock}):`, batchError);
             // Decide: throw error to stop, or just log and continue? Re-throwing for now.
             throw batchError;
        }
    }
    console.log(`Total events fetched: ${allEvents.length}`);
    return allEvents;
}


/**
 * @route   GET /admin/results/summary/:electionId
 * @desc    Get summary statistics using batched event queries.
 * @access  Admin
 */
router.get("/summary/:electionId", adminAuth, async (req, res) => {
    let client;
    const provider = new JsonRpcProvider(process.env.RPC_URL); // Need provider for getNumericBlockRange
    try {
        const election_id_param = req.params.electionId;
        const election_id = parseInt(election_id_param);
        if (isNaN(election_id)) return res.status(400).json({ error: "Invalid Election ID format" });

        client = await pool.connect();
        const electionResult = await client.query("SELECT *, NOW() > end_time AS is_over FROM elections WHERE election_id = $1", [election_id]);
        if (electionResult.rows.length === 0) return res.status(404).json({ error: `Election with ID ${election_id} not found.` });
        const election = electionResult.rows[0];
        const isElectionOver = election.is_over;

        // Get total eligible voters (DB query remains same)
        // ... (your existing logic for totalVoters) ...
        const eligibleVotersQuery = await client.query("SELECT COUNT(*) as count FROM users"); // Adjust as needed
        const totalVoters = parseInt(eligibleVotersQuery.rows[0].count, 10);

        // ---!! MODIFICATION: Get Vote Events using BATCHED query !!---
        const { fromBlock, toBlock } = await getNumericBlockRange(election, election_id, provider);
        const voteFilter = contract.filters.VoteCast(election_id, null, null, null); //
        const voteEvents = await getEventsInBatches(contract, voteFilter, fromBlock, toBlock, BATCH_SIZE);
        const votersVoted = voteEvents.length;
        // -----------------------------------------------------------------

        // Calculate winner if election is over (logic remains same, uses voteEvents)
        if (isElectionOver) {
             if (election.winner_party_name) { /* ... return already decided winner ... */ }

             // Get candidate map from DB
             const allCandidatesQuery = await client.query("SELECT constituency_id, candidate_id, party_name FROM candidates WHERE election_id = $1", [election_id]);
             const candidatePartyMap = new Map();
             allCandidatesQuery.rows.forEach(c => candidatePartyMap.set(`${c.constituency_id}:${c.candidate_id}`, c.party_name));

             // Tally votes from events
             const partyVotes = {};
             for (const event of voteEvents) { /* ... tally logic ... */
                const constituencyId = Number(event.args.assemblyId);
                const candidateId = Number(event.args.candidateId);
                const key = `${constituencyId}:${candidateId}`;
                const party_name = candidatePartyMap.get(key);
                if (party_name) partyVotes[party_name] = (partyVotes[party_name] || 0) + 1;
             }
             // Determine Winner/Tie and send response
             // ... (winner/tie logic using partyVotes) ...
             const maxVotes = Math.max(0, ...Object.values(partyVotes));
             const tiedParties = Object.keys(partyVotes).filter(party => partyVotes[party] === maxVotes);
             if (Object.keys(partyVotes).length === 0 || maxVotes === 0) { res.json({ /* no votes */ }); }
             else if (tiedParties.length === 1) { res.json({ /* winner */ }); }
             else { res.json({ /* tie */ }); }

        } else { // Election still active
            res.json({ election, isElectionOver, totalVoters, votersVoted });
        }

    } catch (err) { /* ... existing error handling ... */
       console.error("❌ Error fetching results summary:", err);
       if (err.message?.includes('eth_getLogs') || err.code === 'UNKNOWN_ERROR') {
          return res.status(429).json({ error: "RPC Log Limit Possibly Exceeded during batching.", details: err.message });
       }
       res.status(500).json({ error: "Failed to fetch results summary", details: err.message });
    } finally {
        if (client) client.release();
    }
});


// --- Route to break a tie ---
router.post("/break-tie", adminAuth, async (req, res) => {
    // Use election_id consistently
    const { electionId: election_id_str, tiedParties } = req.body; // Expect electionId from body
     const election_id = parseInt(election_id_str);

    if (isNaN(election_id) || !tiedParties || !Array.isArray(tiedParties) || tiedParties.length < 2) {
        return res.status(400).json({ error: "Missing/invalid fields for tie-breaker (electionId, tiedParties array)." });
    }

    let client;
    try {
        // Ensure tiedParties has the expected structure, e.g., [{ name: 'PartyA', votes: 100 }, ...]
        if (!tiedParties[0] || typeof tiedParties[0].name !== 'string') {
           return res.status(400).json({ error: "Invalid tiedParties format. Expected array of objects with 'name'." });
        }

        const winnerIndex = crypto.randomInt(0, tiedParties.length);
        const winner = tiedParties[winnerIndex]; // Winner object { name: 'PartyName', votes: X }

        client = await pool.connect();
        // Update the winner_party_name column in the elections table
        const updateResult = await client.query(
            "UPDATE elections SET winner_party_name = $1 WHERE election_id = $2", //
            [winner.name, election_id]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: `Election with ID ${election_id} not found.`});
        }

        res.json({ success: true, message: "Tie-breaker successful!", winningParty: winner });

    } catch (err) {
        console.error("❌ Error breaking tie:", err);
        res.status(500).json({ error: "Failed to break tie", details: err.message });
    } finally {
        if (client) client.release();
    }
});


/**
 * @route   GET /admin/results/:electionId/:constituencyId
 * @desc    Get detailed results for a specific constituency using event query within block range.
 * @access  Admin
 */
router.get("/:electionId/:constituencyId", adminAuth, async (req, res) => {
    let client;
    const provider = new JsonRpcProvider(process.env.RPC_URL); // Need provider
    try {
        const election_id_param = req.params.electionId;
        const constituency_id_param = req.params.constituencyId;
        const election_id = parseInt(election_id_param);
        const constituencyId = parseInt(constituency_id_param);
        if (isNaN(election_id) || isNaN(constituencyId)) return res.status(400).json({ error: "Invalid IDs" });

        client = await pool.connect();

        // Get Election details for block range
        const electionResult = await client.query("SELECT * FROM elections WHERE election_id = $1", [election_id]);
        if (electionResult.rows.length === 0) return res.status(404).json({ error: "Election not found." });
        const election = electionResult.rows[0];

        // Get candidate details from DB
        const dbCandidates = await client.query(/* ... query candidates ... */);
        if (dbCandidates.rows.length === 0) return res.json({ /* no candidates response */ });

        // ---!! MODIFICATION: Get Vote Events using BATCHED query !!---
        const { fromBlock, toBlock } = await getNumericBlockRange(election, election_id, provider);
        // Filter by electionId AND constituencyId
        const voteFilter = contract.filters.VoteCast(election_id, null, null, constituencyId); //
        const voteEvents = await getEventsInBatches(contract, voteFilter, fromBlock, toBlock, BATCH_SIZE);
        // -----------------------------------------------------------------

        // Tally votes locally from events
        const voteCounts = new Map();
        for (const event of voteEvents) { /* ... tally logic ... */
            const candidateId = Number(event.args.candidateId);
            voteCounts.set(candidateId, (voteCounts.get(candidateId) || 0) + 1);
        }

        // Combine DB data + counts and send response
        const candidates = dbCandidates.rows.map(dbCandidate => ({ /* ... combine data ... */}));
        candidates.sort((a, b) => b.votes - a.votes);
        res.json({ electionId: election_id, constituencyId, results: candidates });

    } catch (err) { /* ... existing error handling ... */
      console.error("❌ Error fetching constituency results:", err);
       if (err.message?.includes('eth_getLogs') || err.code === 'UNKNOWN_ERROR') {
          return res.status(429).json({ error: "RPC Log Limit Possibly Exceeded during batching.", details: err.message });
       }
      res.status(500).json({ error: "Failed to fetch election results", details: err.message });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;