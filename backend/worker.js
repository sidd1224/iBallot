const { Worker } = require('bullmq');
const { ethers } = require('ethers');
const pool = require("./database/db");
const blockchain = require("./blockchain/contract");
const contract = blockchain.contract; // Uses Relayer Wallet

require("dotenv").config();

console.log("🚀 Vote Worker Started...");

// Constants
const BATCH_SIZE = 50; // Max votes per transaction
const BATCH_INTERVAL_MS = 2000; // Wait 2s to fill batch
let voteBuffer = [];
let bufferTimer = null;

const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
};

// Initialize Worker
const worker = new Worker('vote-processing', async (job) => {
    // Add job to local buffer
    voteBuffer.push(job);

    // If buffer full, flush immediately
    if (voteBuffer.length >= BATCH_SIZE) {
        await flushBuffer();
    } 
    // If timer not running, start it
    else if (!bufferTimer) {
        bufferTimer = setTimeout(async () => {
            await flushBuffer();
        }, BATCH_INTERVAL_MS);
    }
}, { connection: redisConnection, concurrency: 5 }); // Process 5 jobs at once from Redis to fill buffer fast

async function flushBuffer() {
    if (voteBuffer.length === 0) return;
    
    // Clear timer
    if (bufferTimer) {
        clearTimeout(bufferTimer);
        bufferTimer = null;
    }

    // Move votes from buffer to processing array
    const currentBatch = [...voteBuffer];
    voteBuffer = []; // Clear main buffer so new votes can come in

    console.log(`📦 Processing batch of ${currentBatch.length} votes...`);

    // Prepare Arrays for Smart Contract
    const electionId = currentBatch[0].data.electionId; // Assuming all votes in batch are for same election logic
    // Note: In production, you might group by electionId if multiple elections run parallel.
    
    const voterHashes = currentBatch.map(j => j.data.voterHash);
    const candidateIds = currentBatch.map(j => j.data.candidateId);
    const assemblyIds = currentBatch.map(j => j.data.constituencyId);
    const deadlines = currentBatch.map(j => j.data.deadline);
    const signatures = currentBatch.map(j => j.data.signature);

    let client;
    try {
        // 1. Submit Batch to Blockchain
        // Using the new 'castVoteBatch' function
        const tx = await contract.castVoteBatch(
            electionId,
            voterHashes,
            candidateIds,
            assemblyIds,
            deadlines,
            signatures
        );

        console.log(`🔗 Batch Tx Submitted: ${tx.hash}`);
        await tx.wait(); // Wait for confirmation
        console.log(`✅ Batch Confirmed!`);

        // 2. Log successful votes to DB
        client = await pool.connect();
        
        // Construct bulk insert query
        // We use a loop for simplicity, or pg-format for optimization
        for (const job of currentBatch) {
            await client.query(
                `INSERT INTO voter_logs (election_id, username, constituency_id, tx_hash, vote_time) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [
                    job.data.electionId,
                    job.data.username,
                    job.data.constituencyId,
                    tx.hash // All share same TxHash
                ]
            );
        }
        
    } catch (err) {
        console.error("❌ Batch Transaction Failed:", err);
        // In production: Retry specific failed jobs or log to 'failed_votes' table
        // We don't throw error here to avoid crashing the worker loop
    } finally {
        if (client) client.release();
    }
}