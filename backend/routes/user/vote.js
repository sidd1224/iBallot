const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { JsonRpcProvider, Wallet, ethers } = require("ethers");

const contract = require("../../blockchain/contract");
const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");

require("dotenv").config();

router.post("/", async (req, res) => {
  try {
    const { phone, electionId, candidateId } = req.body;

    if (!phone || electionId === undefined || candidateId === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🔐 Step 1: Hash phone
    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    // 🔓 Step 2: Decrypt metadata
    const metaResult = await pool.query(
      "SELECT encrypted_blob, salt FROM voter_metadata WHERE phone = $1",
      [phoneHash]
    );

    if (metaResult.rows.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }

    const { encrypted_blob: blob, salt } = metaResult.rows[0];
    const key = crypto.scryptSync(phone, Buffer.from(salt, "hex"), 32);
    const metadata = JSON.parse(decrypt(blob, key).toString());

    // ✅ Fetch assembly_id from blob
    const assemblyId = metadata.assembly_id;
    if (!assemblyId) {
      return res.status(400).json({ error: "Assembly ID not found in voter metadata" });
    }

    // 🧠 Step 3: Generate voter hash
    const rawHash = generateVoterHash(metadata.reference_id, process.env.SECRET_SALT);
    const voterHash = "0x" + rawHash;

    // 🔐 Step 4: Decrypt private key
    const keyResult = await pool.query(
      "SELECT enc_private_key FROM voter_control WHERE voter_hash = $1",
      [rawHash]
    );

    if (keyResult.rows.length === 0) {
      return res.status(404).json({ error: "Voter wallet not found" });
    }

    const encryptedKey = keyResult.rows[0].enc_private_key;
    const privateKey = decrypt(encryptedKey, key).toString("utf8");
    const voterWallet = new Wallet(privateKey);

    // 🔁 Step 5: Setup provider + signer
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const signer = contract.connect(relayer);

    // 🧾 Step 6: Create message hash & sign
    const nonce = await signer.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "uint256", "uint256", "uint256"],
      [electionId, voterHash, candidateId, assemblyId, nonce, deadline]
    );

    const signature = await voterWallet.signMessage(ethers.getBytes(messageHash));

    // ✅ Step 7: Cast vote
    const tx = await signer.castVoteMeta(
      electionId,
      voterHash,
      candidateId,
      assemblyId,
      deadline,
      signature
    );
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });

  } catch (err) {
    console.error("❌ Vote Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
