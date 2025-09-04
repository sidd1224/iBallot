const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { JsonRpcProvider, Contract } = require("ethers");

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");

require("dotenv").config();

// Smart contract setup
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

const abi = ["function hasVoted(bytes32) view returns (bool)"];
const votingContract = new Contract(contractAddress, abi, provider);

router.post("/", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    // 🔐 Hash phone before DB lookup
    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    // 🗃️ Fetch encrypted blob and salt using hashed phone
    const result = await pool.query(
      "SELECT encrypted_blob, salt FROM voter_metadata WHERE phone = $1",
      [phoneHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }

    const { encrypted_blob, salt } = result.rows[0];
    const key = crypto.scryptSync(phone, Buffer.from(salt, "hex"), 32);

    const decrypted = decrypt(encrypted_blob, key).toString();
    const metadata = JSON.parse(decrypted); // contains reference_id and phone

    // 🔐 Generate voter hash using metadata (with reference_id inside)
    const rawHash = generateVoterHash(metadata, process.env.SECRET_SALT);
    const voterHash = "0x" + rawHash;

    // 🧠 Check smart contract: has the voter already voted?
    const hasVoted = await votingContract.hasVoted(voterHash);

    return res.status(200).json({ voterHash, hasVoted });

  } catch (err) {
    console.error("❌ Status check error:", err);
    res.status(500).json({ error: "Status check failed", details: err.message });
  }
});

module.exports = router;
