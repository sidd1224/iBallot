const { Worker } = require('bullmq');
const { ethers } = require('ethers');
const pool = require("./database/db");
const blockchain = require("./blockchain/contract");
const contract = blockchain.contract; // Uses Relayer Wallet

require("dotenv").config();

console.log("🚀 Vote Worker Started...");

// Constants
const BATCH_SIZE = 50; 
const BATCH_INTERVAL_MS = 2000; 
let voteBuffer = [];
let bufferTimer = null;

const redisConnection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
};

// Initialize Worker
const worker = new Worker('vote-processing', async (job) => {
    voteBuffer.push(job);

    if (voteBuffer.length >= BATCH_SIZE) {
        await flushBuffer();
    } 
    else if (!bufferTimer) {
        bufferTimer = setTimeout(async () => {
            await flushBuffer();
        }, BATCH_INTERVAL_MS);
    }
}, { connection: redisConnection, concurrency: 5 }); 

async function flushBuffer() {
    if (voteBuffer.length === 0) return;
    
    if (bufferTimer) {
        clearTimeout(bufferTimer);
        bufferTimer = null;
    }

    const currentBatch = [...voteBuffer];
    voteBuffer = []; 

    console.log(`📦 Processing batch of ${currentBatch.length} votes...`);

    const electionId = currentBatch[0].data.electionId; 
    
    const voterHashes = currentBatch.map(j => j.data.voterHash);
    const candidateIds = currentBatch.map(j => j.data.candidateId);
    const assemblyIds = currentBatch.map(j => j.data.constituencyId);
    const deadlines = currentBatch.map(j => j.data.deadline);
    const signatures = currentBatch.map(j => j.data.signature);

    let client;
    try {
        // 1. Submit Batch to Blockchain
        const tx = await contract.castVoteBatch(
            electionId,
            voterHashes,
            candidateIds,
            assemblyIds,
            deadlines,
            signatures
        );

        console.log(`🔗 Batch Tx Submitted: ${tx.hash}`);
        await tx.wait(); 
        console.log(`✅ Batch Confirmed!`);

        // 2. UPDATE existing logs to CONFIRMED
        client = await pool.connect();
        
        // Loop through the batch and update each user's status
        for (const job of currentBatch) {
            await client.query(
                `UPDATE voter_logs 
                 SET tx_hash = $1, status = 'CONFIRMED'
                 WHERE username = $2 AND election_id = $3`,
                [
                    tx.hash,             // $1
                    job.data.username,   // $2
                    job.data.electionId  // $3
                ]
            );
        }
        
    } catch (err) {
        console.error("❌ Batch Transaction Failed:", err);
        
        // OPTIONAL: Mark them as FAILED in DB so you know what happened
        try {
            if (!client) client = await pool.connect();
            for (const job of currentBatch) {
                await client.query(
                    `UPDATE voter_logs SET status = 'FAILED' 
                     WHERE username = $1 AND election_id = $2`,
                    [job.data.username, job.data.electionId]
                );
            }
        } catch (dbErr) {
            console.error("Failed to update status to FAILED:", dbErr);
        }
    } finally {
        if (client) client.release();
    }
}