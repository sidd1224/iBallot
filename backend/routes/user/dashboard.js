// routes/user/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../../database/db");
const userAuth = require("../../middleware/userAuth");

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

    // 2. Fetch elections (✅ removed invalid description column)
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

    // 3. Fetch candidates properly
    const candidatesQuery = await client.query(
      `
      SELECT
        id,
        candidate_id AS "candidateId",
        candidate_name AS "name",
        party_name AS "party",
        symbol,
        constituency_id AS "constituencyId",
        created_at AS "createdAt"
      FROM candidates
      `
    );

    const allCandidates = candidatesQuery.rows;

    // 4. Filter elections for constituency eligibility
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

    // 5. Fetch voting records
    const voterHash = "0x" + user.uid_hash;
    const voteRecords = await client.query(
      `SELECT election_id FROM votes WHERE voter_hash = $1`,
      [voterHash]
    );

    const votedElectionIds = new Set(voteRecords.rows.map(v => v.election_id));

    // 6. Build response EXACT same shape for React
    let calcStats = { active: 0, participated: 0, upcoming: 0 };

    const formattedElections = eligibleElections.map((election) => {
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

      const hasVoted = votedElectionIds.has(election.id);
      if (hasVoted) {
        calcStats.participated++;
      }

      return {
        id: election.id,
        title: election.title,
        description: "No description available", // (frontend kept unchanged)
        type: election.type,
        date: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        status,
        hasVoted
      };
    });

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
