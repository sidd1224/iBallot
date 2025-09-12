const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { JsonRpcProvider, Wallet, ethers } = require("ethers");

const contract = require("../../blockchain/contract");
const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");

require("dotenv").config();

/**
 * @route   POST /vote
 * @desc    Casts a vote on behalf of a user via a meta-transaction.
 * @access  Private (requires username/password)
 */
router.post("/", async (req, res) => {
  try {
    const { username, password, electionId, candidateId } = req.body;

    if (!username || !password || electionId === undefined || candidateId === undefined) {
      return res.status(400).json({ error: "Missing required fields for voting." });
    }

    // Step 1: Authenticate the user (like login)
    const userResult = await pool.query("SELECT * FROM voter_metadata WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = userResult.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Step 2: Decrypt user metadata to get reference ID and assembly ID
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const decryptedBlobString = decrypt(user.encrypted_blob, secretKey);
    const metadata = JSON.parse(decryptedBlobString);
    
    const refId = metadata.reference_id;
    const assemblyId = user.assembly_id; // Directly use the verified ID from the user record

    if (!refId || assemblyId === undefined) {
        throw new Error("Critical error: User metadata is missing reference or assembly ID.");
    }

    // Step 3: Generate voter hash and fetch the encrypted private key
    const rawVoterHash = generateVoterHash(refId, process.env.SECRET_SALT);
    const voterHash = "0x" + rawVoterHash;

    const keyResult = await pool.query(
      "SELECT enc_private_key FROM voter_control WHERE voter_hash = $1",
      [rawVoterHash]
    );

    if (keyResult.rows.length === 0) {
      return res.status(404).json({ error: "Voter wallet control data not found." });
    }

    // Step 4: Decrypt the private key and create the voter's wallet
    const encryptedKey = keyResult.rows[0].enc_private_key;
    const privateKey = decrypt(encryptedKey, secretKey);
    const voterWallet = new Wallet(privateKey);

    // Step 5: Setup provider, relayer, and smart contract signer
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);

    // Step 6: Create the message hash to be signed by the voter's wallet
    const nonce = await signer.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10-minute deadline

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "uint256", "uint256", "uint256"],
      [electionId, voterHash, candidateId, assemblyId, nonce, deadline]
    );

    const signature = await voterWallet.signMessage(ethers.getBytes(messageHash));

    // Step 7: The relayer submits the meta-transaction to the smart contract
    const tx = await signer.castVoteMeta(
      electionId,
      voterHash,
      candidateId,
      assemblyId,
      deadline,
      signature
    );
    await tx.wait();

    // Step 8: Update local database to reflect that the vote has been cast
    await pool.query(
        `UPDATE voter_control SET cast_vote = true WHERE voter_hash = $1`,
        [rawVoterHash]
    );

    res.status(200).json({ success: true, message: "Vote cast successfully!", txHash: tx.hash });

  } catch (err) {
    console.error("❌ Vote Casting Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
