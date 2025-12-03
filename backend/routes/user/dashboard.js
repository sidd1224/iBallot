// backend/routes/user/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../../database/db");
const userAuth = require("../../middleware/userAuth");

// 🟢 Required blockchain imports
const { contract } = require("../../blockchain/contract");
const { retryBlockchainCall } = require("../../utils/blockchainUtils");

router.get("/", userAuth, async (req, res) => {
  let client;

  try {
    client = await db.connect();

    const { uidHash, username } = req.user || {};

    if (!uidHash && !username) {
      return res.status(401).json({ error: "Invalid token payload: no uidHash/username." });
    }

    // 1. Fetch User + Constituency
    const userQuery = await client.query(
      `
      SELECT 
        u.username,
        u.uid_hash,
        e.ac_id,
        e.pc_id
      FROM users u
      LEFT JOIN eci_admin_data e ON u.uid_hash = e.uid_hash
      WHERE
        ($1::text IS NOT NULL AND u.uid_hash = $1)
        OR
        ($2::text IS NOT NULL AND u.username = $2)
      LIMIT 1
      `,
      [uidHash || null, username || null]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userQuery.rows[0];

    // 2. Fetch elections
    const electionsQuery = await client.query(
      `
      SELECT 
        election_id AS id,
        name AS title,
        type,
        start_time,
        end_time,
        enabled_constituencies
      FROM elections
      ORDER BY start_time DESC
      `
    );

    const allElections = electionsQuery.rows;

    // 4. Filter constituency-based elections
    const eligibleElections = allElections.filter((election) => {
      if (!election.enabled_constituencies || election.enabled_constituencies.length === 0) {
        return true;
      }

      if (election.type === "STATE_LEGISLATIVE") {
        return user.ac_id && election.enabled_constituencies.includes(user.ac_id);
      }

      if (election.type === "PARLIAMENTARY") {
        return user.pc_id && election.enabled_constituencies.includes(user.pc_id);
      }

      return false;
    });

    // 5. ✅ FIXED: Fetch SQL vote records from 'voter_logs' using 'username'
    // Previous code queried 'votes' table which does not exist/is not used by vote.js
    const voteRecords = await client.query(
      `SELECT election_id FROM voter_logs WHERE username = $1`,
      [user.username]
    );
    
    // Create a Set of IDs for O(1) lookup. Ensure IDs are Numbers to match election.id
    const votedElectionIds = new Set(voteRecords.rows.map((v) => Number(v.election_id)));

    // 6. Build final response
    let calcStats = { active: 0, participated: 0, upcoming: 0 };
    const formattedElections = [];

    for (const election of eligibleElections) {
      const now = new Date();
      const start = new Date(election.start_time);
      const end = new Date(election.end_time);

      let status = "Upcoming";
      if (now >= start && now <= end) {
        status = "Live";
        calcStats.active++;
      } else if (now > end) {
        status = "Completed";
      } else {
        calcStats.upcoming++;
      }

      let hasVoted = false;

      // 🟢 Logic: 
      // 1. If we find it in the DB (voter_logs), they definitely voted.
      // 2. If not in DB AND it's Live, double-check Blockchain (in case DB write failed).
      if (votedElectionIds.has(Number(election.id))) {
         hasVoted = true;
      } else if (status === "Live") {
        try {
          hasVoted = await retryBlockchainCall(() =>
            contract.hasVoted(
              BigInt(election.id),
              "0x" + user.uid_hash
            )
          );
        } catch (err) {
          console.error(
            `⚠️ Blockchain hasVoted failed for election ${election.id}:`,
            err.message
          );
          hasVoted = false;
        }
      }

      if (hasVoted) {
        calcStats.participated++;
      }

      formattedElections.push({
        id: election.id,
        title: election.title,
        description: "No description available",
        type: election.type,
        date: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        status,
        hasVoted,
      });
    }

    res.status(200).json({
      user: {
        name: user.username,
        uidHash: user.uid_hash,
        constituency: {
          ac_id: user.ac_id,
          pc_id: user.pc_id,
        },
      },
      stats: {
        activeRegistrations: calcStats.active,
        electionsParticipated: calcStats.participated,
        upcomingElections: calcStats.upcoming,
      },
      elections: formattedElections,
    });

  } catch (err) {
    console.error("❌ Dashboard Error:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard data." });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;