// backend/jobs/election-manager-job.js
require('dotenv').config(); // Keep for potential direct testing/debugging
const { Pool } = require('pg');
const { ethers, Wallet, JsonRpcProvider } = require('ethers'); // Keep ethers for potential direct calls if needed, though instance is passed in
const contractAbi = require('../blockchain/Voting.json').abi; //

// --- Configuration ---
const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  console.error("❌ Missing DB_URL environment variable.");
  // Avoid exiting if loaded as a module
}

// Create a pool instance that can be used by the function
const pool = new Pool({ connectionString: dbUrl }); //

/**
 * Checks the status of a single election and triggers start/end transactions if necessary.
 * @param {string|number} electionId - The ID of the election to check.
 * @param {ethers.Contract} contractInstance - An initialized ethers.Contract instance with a signer.
 * @returns {Promise<{shouldStop: boolean}>} - Returns object indicating if further checks should stop.
 */
async function checkAndManageSingleElection(electionId, contractInstance) {
  console.log(`[${new Date().toISOString()}] Checking status for election ID: ${electionId}...`);
  let client;
  try {
    client = await pool.connect();
    const now = new Date();

    // Get the specific election details from the database
    const electionResult = await client.query(
      "SELECT election_id, start_time, end_time, start_block, end_block FROM elections WHERE election_id = $1", //
      [electionId]
    );

    if (electionResult.rows.length === 0) {
      console.warn(`Election ${electionId} not found in DB during check. Stopping checks.`);
      return { shouldStop: true }; // Signal to stop scheduling for this ID
    }
    const election = electionResult.rows[0];
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    // --- Start Logic ---
    // Check if the current time is past the start time AND the start_block hasn't been recorded yet
    if (now >= startTime && !election.start_block) {
      console.log(`Election ${electionId} needs starting action (checking blockchain)...`);
      try {
        const startTimeUnix = Math.floor(startTime.getTime() / 1000);
        const endTimeUnix = Math.floor(endTime.getTime() / 1000);

        if (!contractInstance) {
           console.warn(`Contract instance not provided for election ${electionId}, cannot attempt startElection call.`);
        } else {
            // Check if contract already has a start block (in case of server restart or missed DB update)
            const currentStartBlockBigInt = await contractInstance.electionStartBlock(electionId); //
            const currentStartBlock = Number(currentStartBlockBigInt); // Convert BigInt to Number

            if (currentStartBlock > 0) {
                console.log(`Election ${electionId} already has start block ${currentStartBlock} on chain. Updating DB.`);
                // Update DB if it was missed
                await client.query(
                   "UPDATE elections SET start_block = $1 WHERE election_id = $2 AND start_block IS NULL",
                   [currentStartBlock, electionId]
                 );
                 // Don't stop here, proceed to check end time in the same run
            } else {
                // Call startElection only if block number is 0 on-chain
                console.log(`Calling startElection on contract for election ID: ${electionId}...`);
                const tx = await contractInstance.startElection(electionId, startTimeUnix, endTimeUnix); //
                const receipt = await tx.wait(1); // Wait for 1 confirmation

                if (receipt && receipt.status === 1) {
                    const startBlock = receipt.blockNumber;
                    await client.query(
                        "UPDATE elections SET start_block = $1 WHERE election_id = $2",
                        [startBlock, electionId]
                    );
                    console.log(`✅ Started election ${electionId} on-chain at block ${startBlock}, updated DB.`);
                    // Update local variable for the end logic check below
                    election.start_block = startBlock;
                } else {
                    throw new Error(`startElection transaction failed or reverted (Tx Hash: ${receipt?.transactionHash})`);
                }
            }
        }
      } catch (err) {
          console.error(`❌ Error during start logic for election ${electionId}:`, err.message);
          // Potential errors: "Election already started" from contract require, transaction failure, RPC error.
          // Decide if we should retry later or stop? Continuing to check end time for now.
      }
    } // End of start logic block

    // --- End Logic ---
    // Check if current time is past end time, AND election has started (start_block is set), AND end_block is NOT set
    if (now >= endTime && election.start_block && !election.end_block) {
        console.log(`Election ${electionId} needs ending action (checking blockchain)...`);
        try {
            if (!contractInstance) {
               console.warn(`Contract instance not provided for election ${electionId}, cannot attempt endElection call.`);
            } else {
                 // Check if contract already has an end block
                 const currentEndBlockBigInt = await contractInstance.electionEndBlock(electionId); //
                 const currentEndBlock = Number(currentEndBlockBigInt);

                 if (currentEndBlock > 0) {
                    console.log(`Election ${electionId} already has end block ${currentEndBlock} on chain. Updating DB.`);
                    await client.query(
                       "UPDATE elections SET end_block = $1 WHERE election_id = $2 AND end_block IS NULL",
                       [currentEndBlock, electionId]
                    );
                    console.log(`✅ Marked election ${electionId} as ended in DB (already ended on chain).`);
                    return { shouldStop: true }; // Election is fully ended
                 } else {
                    // Call endElection only if block number is 0 on-chain
                    console.log(`Calling endElection on contract for election ID: ${electionId}...`);
                    const tx = await contractInstance.endElection(electionId); //
                    const receipt = await tx.wait(1);

                    if (receipt && receipt.status === 1) {
                      const endBlock = receipt.blockNumber;
                      await client.query(
                          "UPDATE elections SET end_block = $1 WHERE election_id = $2",
                          [endBlock, electionId]
                      );
                      console.log(`✅ Ended election ${electionId} on-chain at block ${endBlock}, updated DB.`);
                      return { shouldStop: true }; // Election is now fully ended
                    } else {
                        throw new Error(`endElection transaction failed or reverted (Tx Hash: ${receipt?.transactionHash})`);
                    }
                 }
            }
        } catch (err) {
            console.error(`❌ Error during end logic for election ${electionId}:`, err.message);
            // Potential errors: "Election already marked as ended", "Election not yet over", transaction failure, RPC error.
            // If it failed, we want the scheduler to try again later.
            return { shouldStop: false }; // Keep trying if ending failed unexpectedly
        }
    } else if (election.end_block) {
        // If end_block is already set in DB, we don't need to check anymore
        console.log(`Election ${electionId} is already finished according to DB.`);
        return { shouldStop: true }; // Already ended, stop checking
    } else {
       // Condition not met (either not started, or not past end time)
       console.log(`Election ${electionId} is ongoing or not yet started.`);
    }

    // If we reached here, it means the election hasn't definitively ended yet
    return { shouldStop: false }; // Continue scheduling checks

  } catch (error) {
    console.error(`❌ FATAL ERROR checking election ${electionId}:`, error);
    return { shouldStop: false }; // Let scheduler decide if it should retry
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Export the function for use by the scheduler in elections.js
module.exports = { checkAndManageSingleElection };

// Export the pool instance only if absolutely necessary for other modules (e.g., graceful shutdown)
// module.exports.pool = pool;