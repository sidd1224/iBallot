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
// 👇 1. Import your auth middleware
const userAuth = require("../../middleware/userAuth"); 

require("dotenv").config();

const voteQueue = new Queue('vote-processing', {
    connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
    }
});

// 👇 2. Add 'userAuth' here to protect the route
router.post("/", userAuth, async (req, res) => {
  let client;
  try {
    // 👇 3. Remove 'username' from body. We only trust 'password' (for re-auth)
    const { password, electionId, candidateId } = req.body;
    
    // 👇 4. Get the trusted username from the Token instead
    // (This ensures a user cannot vote on behalf of someone else)
    const username = req.user.username; 

    if (!username || !password || electionId === undefined || candidateId === undefined) {
      return res.status(400).json({ error: "Missing required fields for voting." });
    }

    client = await pool.connect();

    // ---------------------------------------------------------
    // ✅ THIS IS WHERE YOU FETCH UIDHASH (Already Correct)
    // ---------------------------------------------------------
    const userResult = await client.query(
      "SELECT id, username, uid_hash, password FROM users WHERE username = $1",
      [username] // Now using the trusted username from token
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "User not found." });
    }
    
    // The sensitive hash is retrieved securely here
    const user = userResult.rows[0]; 

    // Verify the password provided in the body matches the user found via token
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid password confirmation." });
    }

    // ... Rest of your logic remains exactly the same ...
    const eciResult = await client.query(
      "SELECT enc_private_key, ac_id, pc_id FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash] // using the fetched hash
    );

    if (eciResult.rows.length === 0) {
      return res.status(404).json({ error: "User data not found in ECI records." });
    }
    const eciData = eciResult.rows[0];

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