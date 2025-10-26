const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
// --- REMOVE JsonRpcProvider and ethers ---
// const { JsonRpcProvider, Wallet, ethers } = require("ethers");
const { Wallet, ethers } = require("ethers"); // Keep ethers for utility functions

// --- FIX: Import the whole module ---
// const contract = require("../../blockchain/contract");
const blockchain = require("../../blockchain/contract");
const contract = blockchain.contract; // Use the exported contract instance
// --- END FIX ---

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

    // Fetch ECI admin data, now including ac_id and pc_id
    const eciResult = await client.query(
      "SELECT enc_private_key, ac_id, pc_id FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash]
    );
    if (eciResult.rows.length === 0) {
      return res.status(404).json({ error: "User data not found in ECI records." });
    }
    const eciData = eciResult.rows[0];

    // Determine the election type to select the correct constituency ID
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

    // Decrypt the user's private key to sign the transaction
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);

    // --- CORRECTED LOGIC ---
    // The decrypt function returns a Buffer, which must be converted to a string.
    const decryptedKeyBuffer = decrypt(eciData.enc_private_key, secretKey);
    const privateKey = decryptedKeyBuffer.toString('utf8'); // Ensure correct encoding
    // Validate the private key format before creating the wallet
     if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
        console.error(`❌ Invalid decrypted private key format for user ${username}. Length: ${privateKey?.length}`);
        return res.status(500).json({ success: false, error: "Internal error: Failed to retrieve voter credentials." });
     }
    const voterWallet = new Wallet(privateKey);
    // --- END CORRECTION ---

    // --- REMOVED Unnecessary provider/relayer/signer creation ---
    // const provider = new JsonRpcProvider(process.env.RPC_URL);
    // const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    // const signer = contract.connect(relayer);
    // --- END REMOVED ---

    // --- FIX: Use the imported 'contract' object directly ---
    const nonce = await retryBlockchainCall(() => contract.getNonce(electionId, voterHash));
    // --- END FIX ---

    const deadline = Math.floor(Date.now() / 1000) + 600; // Signature is valid for 10 minutes

    // The message hash must match the one in the smart contract EXACTLY
     // Using solidityPackedKeccak256 requires careful type handling
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "uint256", "uint256", "uint256"],
      [
          BigInt(electionId),       // Ensure uint256
          voterHash,                // bytes32
          BigInt(candidateId),      // Ensure uint256
          BigInt(constituencyId),   // Ensure uint256
          nonce,                    // Already BigInt from contract
          BigInt(deadline)          // Ensure uint256
      ]
    );

    // Sign the EIP-191 prefixed hash (this is what .toEthSignedMessageHash does)
    const messageBytes = ethers.getBytes(messageHash);
    const signature = await voterWallet.signMessage(messageBytes);
    console.log(`[Vote Route] Generated signature for voter ${username}`);

    // --- FIX: Use the imported 'contract' object directly ---
    // The relayer (the signer attached to 'contract' in contract.js) calls the meta-transaction function
    console.log(`[Vote Route] Relayer calling castVoteMeta with ElectionID: ${electionId}, VoterHash: ${voterHash}, CandidateID: ${candidateId}, ConstituencyID: ${constituencyId}, Nonce: ${nonce}, Deadline: ${deadline}`);
    const tx = await retryBlockchainCall(() => contract.castVoteMeta(
      BigInt(electionId),
      voterHash,
      BigInt(candidateId),
      BigInt(constituencyId),
      BigInt(deadline),
      signature
    ));
    // --- END FIX ---
     console.log(`[Vote Route] Transaction submitted: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await retryBlockchainCall(() => tx.wait());
    console.log(`[Vote Route] Transaction confirmed. Block: ${receipt.blockNumber}`);


    res.status(200).json({
      success: true,
      message: "Vote cast successfully!",
      txHash: tx.hash
    });

  } catch (err) {
    console.error("❌ Vote Casting Error:", err);
    // Provide a more generic error to the user
    res.status(500).json({ success: false, error: "Failed to cast vote due to an internal server error." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
