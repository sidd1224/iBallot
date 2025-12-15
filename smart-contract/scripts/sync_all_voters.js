const hre = require("hardhat");
const { Pool } = require("pg");
require("dotenv").config();

// Database Config (Match your .env or docker-compose)
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS is missing in .env");
    return;
  }

  // 1. Connect to Blockchain
  console.log(`🔗 Connecting to contract: ${contractAddress}`);
  const Voting = await hre.ethers.getContractFactory("Voting");
  const contract = Voting.attach(contractAddress);

  // 2. Fetch ALL registered voters from DB
  // We need 'uid_hash' (Who they are) and 'wallet_address' (Their Key)
  console.log("📥 Fetching voters from Database...");
  let client;
  let voters = [];

  try {
    client = await pool.connect();
    const res = await client.query(
      `SELECT uid_hash, wallet_address 
       FROM eci_admin_data 
       WHERE wallet_address IS NOT NULL`
    );
    voters = res.rows;
  } catch (err) {
    console.error("❌ Database Error:", err);
    return;
  } finally {
    if (client) client.release();
  }

  console.log(`📊 Found ${voters.length} registered voters in DB.`);

  // 3. Loop and Sync
  for (const voter of voters) {
    const voterHash = "0x" + voter.uid_hash;
    const walletAddr = voter.wallet_address;

    // Check if already authorized
    const currentAuth = await contract.authorizedVoter(voterHash);
    
    if (currentAuth.toLowerCase() === walletAddr.toLowerCase()) {
        console.log(`✅ [Skipped] Already authorized: ${voterHash.slice(0, 10)}...`);
        continue;
    }

    // Authorize if missing
    console.log(`🛠  Authorizing: ${voterHash.slice(0, 10)}... -> ${walletAddr}`);
    try {
        const tx = await contract.authorizeVoter(voterHash, walletAddr);
        console.log(`   ⏳ Tx Sent: ${tx.hash}`);
        await tx.wait();
        console.log(`   🎉 Success!`);
    } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  console.log("\n🏁 Sync Complete! Restart your backend now.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});