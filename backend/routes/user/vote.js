const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { JsonRpcProvider, Wallet, ethers } = require("ethers");

const contract = require("../../blockchain/contract");
const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");

require("dotenv").config();

/**
 * @route   POST /vote
 * @desc    Casts a vote on behalf of a user via a meta-transaction.
 * @access  Private (requires username/password)
 */
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
      client.release();
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const user = userResult.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      client.release();
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Fetch ECI admin data, now including ac_id and pc_id
    const eciResult = await client.query(
      "SELECT enc_private_key, ac_id, pc_id FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash]
    );
    if (eciResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "User data not found in ECI records." });
    }
    const eciData = eciResult.rows[0];

    // Determine the election type to select the correct constituency ID
    const electionTypeResult = await client.query(
      "SELECT type FROM elections WHERE election_id = $1",
      [electionId]
    );
    if (electionTypeResult.rows.length === 0) {
      client.release();
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
        client.release();
        return res.status(400).json({ error: "User is not eligible for this type of election." });
    }

    const voterHash = "0x" + user.uid_hash;

    // Decrypt the user's private key to sign the transaction
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const privateKey = decrypt(eciData.enc_private_key, secretKey);
    const voterWallet = new Wallet(privateKey);

    // Set up the relayer wallet that will pay for the gas
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);

    const nonce = await signer.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600; // Signature is valid for 10 minutes

    // The message hash must match the one in the smart contract EXACTLY, using the numeric constituencyId
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "uint256", "uint256", "uint256"],
      [electionId, voterHash, candidateId, constituencyId, nonce, deadline]
    );

    const signature = await voterWallet.signMessage(ethers.getBytes(messageHash));

    // The relayer calls the meta-transaction function with all the required data
    const tx = await signer.castVoteMeta(
      electionId,
      voterHash,
      candidateId,
      constituencyId, // Pass the correct numeric constituencyId to the contract
      deadline,
      signature
    );
    await tx.wait();

    res.status(200).json({
      success: true,
      message: "Vote cast successfully!",
      txHash: tx.hash
    });

  } catch (err) {
    console.error("❌ Vote Casting Error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;

