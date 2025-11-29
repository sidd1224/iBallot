const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Wallet, ethers } = require("ethers"); 

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

    // 1. Authenticate user
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

    const voterHash = "0x" + user.uid_hash;

    // 2. FAST FAIL: Check Database First
    // Before doing expensive blockchain work, check if we already recorded a vote locally
    const existingVote = await client.query(
      "SELECT 1 FROM votes WHERE voter_hash = $1 AND election_id = $2",
      [voterHash, electionId]
    );

    if (existingVote.rows.length > 0) {
      return res.status(400).json({ error: "You have already voted in this election." });
    }

    // 3. Fetch ECI admin data
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
        return res.status(400).json({ error: "User is not eligible for this election." });
    }

    // 5. Decrypt Private Key & Prepare Wallet
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const decryptedKeyBuffer = decrypt(eciData.enc_private_key, secretKey);
    const privateKey = decryptedKeyBuffer.toString('utf8'); 
    
     if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
        console.error(`❌ Invalid private key format for ${username}`);
        return res.status(500).json({ success: false, error: "Credential error." });
     }
    const voterWallet = new Wallet(privateKey);

    // 6. Blockchain: Get Nonce & Sign
    const nonce = await retryBlockchainCall(() => contract.getNonce(electionId, voterHash));
    const deadline = Math.floor(Date.now() / 1000) + 600; 

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

    // 7. Blockchain: Relay Transaction
    console.log(`[Vote Route] Relaying vote for ${username}...`);
    const tx = await retryBlockchainCall(() => contract.castVoteMeta(
      BigInt(electionId),
      voterHash,
      BigInt(candidateId),
      BigInt(constituencyId),
      BigInt(deadline),
      signature
    ));
    
    console.log(`[Vote Route] Tx submitted: ${tx.hash}`);
    
    // 8. Wait for Confirmation
    const receipt = await retryBlockchainCall(() => tx.wait());
    console.log(`[Vote Route] Confirmed in block: ${receipt.blockNumber}`);

    // 9. CRITICAL: Update Local Database
    // We assume Postgres syntax here ($1, $2). If MySQL, replace logic with INSERT IGNORE.
    try {
        await client.query(
            `INSERT INTO votes (voter_hash, election_id, has_voted, created_at)
             VALUES ($1, $2, true, NOW())
             ON CONFLICT (voter_hash, election_id) DO NOTHING`, 
            [voterHash, electionId]
        );
        console.log(`[Vote Route] Local DB updated for user ${username}`);
    } catch (dbErr) {
        // NOTE: If this fails, the vote is still on blockchain. 
        // We log it but don't fail the request to the user.
        console.error("⚠️ Failed to update local votes table:", dbErr);
    }

    res.status(200).json({
      success: true,
      message: "Vote cast successfully!",
      txHash: tx.hash
    });

  } catch (err) {
    console.error("❌ Vote Casting Error:", err);
    // Handle potential reverts from smart contract
    if (err.message.includes("User has already voted")) {
        return res.status(400).json({ success: false, error: "Blockchain rejected: You have already voted." });
    }
    res.status(500).json({ success: false, error: "Failed to cast vote." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;