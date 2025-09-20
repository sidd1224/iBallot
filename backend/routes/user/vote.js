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
 */// Utility to generate clean IDs
function generateElectionIds(ac_name, pc_name, ward_number) {
  // Normalize names: uppercase, replace spaces with underscores
  const cleanAc = ac_name.toUpperCase().replace(/\s+/g, "_");
  const cleanPc = pc_name.toUpperCase().replace(/\s+/g, "_");

  const assemblyId = `${cleanAc}_${ward_number}`;
  const parliamentaryId = `${cleanPc}_${ward_number}`;

  return { assemblyId, parliamentaryId };
}

router.post("/", async (req, res) => {
  try {
    const { username, password, electionId, candidateId } = req.body;

    if (!username || !password || electionId === undefined || candidateId === undefined) {
      return res.status(400).json({ error: "Missing required fields for voting." });
    }

    // Authenticate user
    const userResult = await pool.query(
      "SELECT id, username, uid_hash, password FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) return res.status(401).json({ error: "Invalid credentials." });
    const user = userResult.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ error: "Invalid credentials." });

    // Fetch ECI admin data
    const eciResult = await pool.query(
      "SELECT ac_name, pc_name, ward_number, enc_private_key FROM eci_admin_data WHERE uid_hash = $1",
      [user.uid_hash]
    );
    if (eciResult.rows.length === 0) return res.status(404).json({ error: "User data not found in ECI records." });

    const eciData = eciResult.rows[0];

    // ✅ Generate dynamic IDs
    const { assemblyId, parliamentaryId } = generateElectionIds(
      eciData.ac_name,
      eciData.pc_name,
      eciData.ward_number
    );

    // Use whichever ID is relevant to this election
    // (you might decide based on election type passed in electionId or metadata)
    console.log("Generated Assembly ID:", assemblyId);
    console.log("Generated Parliamentary ID:", parliamentaryId);

    const voterHash = "0x" + user.uid_hash;

    // Decrypt private key
    const secretKey = crypto.scryptSync(process.env.SECRET_SALT, "aadhaar_salt", 32);
    const privateKey = decrypt(eciData.enc_private_key, secretKey);
    const voterWallet = new Wallet(privateKey);

    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);

    const nonce = await signer.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "string", "uint256", "uint256"],
      [electionId, voterHash, candidateId, assemblyId, nonce, deadline]
    );

    const signature = await voterWallet.signMessage(ethers.getBytes(messageHash));

    const tx = await signer.castVoteMeta(
      electionId,
      voterHash,
      candidateId,
      assemblyId,
      deadline,
      signature
    );
    await tx.wait();

    res.status(200).json({
      success: true,
      message: "Vote cast successfully!",
      txHash: tx.hash,
      assemblyId,
      parliamentaryId
    });

  } catch (err) {
    console.error("❌ Vote Casting Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
