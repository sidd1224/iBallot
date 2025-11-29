const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, ethers } = require("ethers"); 

// ✅ Import broadcast from your existing websocket.js
const { broadcast } = require("../../websocket");

const blockchain = require("../../blockchain/contract");
const contract = blockchain.contract; 
const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

require("dotenv").config();

router.post("/", async (req, res) => {
  let client;
  try {
    const { username, password, electionId, candidateId } = req.body;

    if (!username || !password || electionId === undefined || candidateId === undefined) {
      return res.status(400).json({ error: "Missing required fields for voting." });
    }

    client = await pool.connect();

    // Authenticate user
    const userResult = await client.query(
      "SELECT id, username, uid_hash, password FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = userResult.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Fetch ECI admin data
    const eciResult = await client.query(
      "SELECT enc_private_key, ac_id, pc_id FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash]
    );
    if (eciResult.rows.length === 0) {
      return res.status(404).json({ error: "User data not found in ECI records." });
    }
    const eciData = eciResult.rows[0];

    // Determine constituency ID
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
        return res.status(400).json({ error: "User is not eligible for this type of election based on constituency." });
    }

    const voterHash = "0x" + user.uid_hash;

    // Decrypt private key
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const decryptedKeyBuffer = decrypt(eciData.enc_private_key, secretKey);
    const privateKey = decryptedKeyBuffer.toString('utf8');
    
     if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
        console.error(`❌ Invalid decrypted private key format for user ${username}.`);
        return res.status(500).json({ success: false, error: "Internal error: Failed to retrieve voter credentials." });
     }
    const voterWallet = new Wallet(privateKey);

    const nonce = await retryBlockchainCall(() => contract.getNonce(electionId, voterHash));
    const deadline = Math.floor(Date.now() / 1000) + 600; 

    // Sign Vote
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
    console.log(`[Vote Route] Generated signature for voter ${username}`);

    // Submit to Blockchain
    console.log(`[Vote Route] Relayer calling castVoteMeta...`);
    const tx = await retryBlockchainCall(() => contract.castVoteMeta(
      BigInt(electionId),
      voterHash,
      BigInt(candidateId),
      BigInt(constituencyId),
      BigInt(deadline),
      signature
    ));
    console.log(`[Vote Route] Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await retryBlockchainCall(() => tx.wait());
    console.log(`[Vote Route] Transaction confirmed. Block: ${receipt.blockNumber}`);

    // ✅ NEW: Broadcast the live vote update to all connected clients
    broadcast({
      type: "VOTE_UPDATE",
      electionId: parseInt(electionId),
      candidateId: parseInt(candidateId)
    });

    res.status(200).json({
      success: true,
      message: "Vote cast successfully!",
      txHash: tx.hash
    });

  } catch (err) {
    console.error("❌ Vote Casting Error:", err);
    res.status(500).json({ success: false, error: "Failed to cast vote due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;