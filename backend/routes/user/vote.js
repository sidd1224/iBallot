const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, ethers } = require("ethers");
const { Queue } = require('bullmq');

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");
const blockchain = require("../../blockchain/contract");
const contract = blockchain.contract;
const userAuth = require("../../middleware/userAuth"); 

require("dotenv").config();

const voteQueue = new Queue('vote-processing', {
    connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }
});

router.post("/", userAuth, async (req, res) => {
  let client;
  try {
    const { password, electionId, candidateId } = req.body;
    const username = req.user.username; 

    if (!username || !password || electionId === undefined || candidateId === undefined) {
      return res.status(400).json({ error: "Missing required fields for voting." });
    }

    client = await pool.connect();

    // 1. Fetch User
    const userResult = await client.query(
      "SELECT id, username, uid_hash, password FROM users WHERE username = $1",
      [username] 
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "User not found." });
    }
    const user = userResult.rows[0]; 

    // 2. Verify Password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid password confirmation." });
    }

    // 3. Get ECI Data
    const eciResult = await client.query(
      "SELECT enc_private_key, ac_id, pc_id FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash] 
    );

    if (eciResult.rows.length === 0) {
      return res.status(404).json({ error: "User data not found in ECI records." });
    }
    const eciData = eciResult.rows[0];

    // 4. Determine Constituency
    const electionTypeResult = await client.query(
      "SELECT type FROM elections WHERE election_id = $1",
      [electionId]
    );
    
    if (electionTypeResult.rows.length === 0) {
      return res.status(404).json({ error: "Election not found." });
    }
    const electionType = electionTypeResult.rows[0].type;

    let constituencyId;
    if (electionType === 'STATE_LEGISLATIVE') {
        constituencyId = eciData.ac_id;
    } else if (electionType === 'PARLIAMENTARY') {
        constituencyId = eciData.pc_id;
    }

    if (!constituencyId) {
        return res.status(400).json({ error: "User is not eligible for this type of election." });
    }

    // 5. Decrypt Key & Sign
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    let privateKey;
    try {
        const decryptedKeyBuffer = decrypt(eciData.enc_private_key, secretKey);
        privateKey = decryptedKeyBuffer.toString('utf8');
    } catch (decErr) {
        console.error("Decryption failed:", decErr);
        return res.status(500).json({ error: "Security error: Failed to access voter wallet." });
    }
    
    const voterWallet = new Wallet(privateKey);
    const voterHash = "0x" + user.uid_hash;

    const nonce = await retryBlockchainCall(() => contract.getNonce(electionId, voterHash));
    const deadline = Math.floor(Date.now() / 1000) + 3600; 

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "uint256", "uint256", "uint256"],
      [
          BigInt(electionId),       
          voterHash,                
          BigInt(candidateId),      
          BigInt(constituencyId),   
          nonce,                    
          BigInt(deadline)          
      ]
    );

    const messageBytes = ethers.getBytes(messageHash);
    const signature = await voterWallet.signMessage(messageBytes);
    privateKey = null; 

    // ✅ STEP 6: Insert 'QUEUED' log into DB
    await client.query(
      `INSERT INTO voter_logs 
       (election_id, constituency_id, username, vote_time, status)
       VALUES ($1, $2, $3, NOW(), $4)`,
      [electionId, constituencyId, username, 'QUEUED']
    );

    // ✅ STEP 7: Add to Redis Queue
    await voteQueue.add('cast-vote', {
        electionId,
        voterHash,
        candidateId,
        constituencyId,
        deadline,
        signature,
        username, 
        timestamp: Date.now()
    });
    
    console.log(`[Vote Ingest] Vote queued for user: ${username}`);

    res.status(202).json({
      success: true,
      message: "Vote received and queued securely.",
      status: "queued"
    });

  } catch (err) {
    console.error("❌ Vote Ingest Error:", err);
    res.status(500).json({ success: false, error: "Internal server error during vote processing." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;