// utils/fuzzyDistrictMatcher.js
const Fuse = require("fuse.js");
const pool = require("../database/db"); // PostgreSQL pool

let fuse = null;
let officialDistricts = [];

async function initializeDistrictMatcher() {
  const result = await pool.query("SELECT DISTINCT district_name FROM assembly_constituencies");
  officialDistricts = result.rows.map(r => r.district_name.trim().toLowerCase());

  fuse = new Fuse(officialDistricts, {
    includeScore: true,
    threshold: 0.4, // tolerance for spelling mistakes
  });
}

async function matchDistrictToConstituencies(state, aadhaarDistrict) {
  if (!fuse) await initializeDistrictMatcher();

  const matches = fuse.search(aadhaarDistrict.trim().toLowerCase());
  if (matches.length === 0) return null;

  const bestMatch = matches[0].item; // fuzzy-corrected district

  // ✅ Get assemblies
  const assemblies = await pool.query(
    `SELECT assembly_id, constituency_name 
     FROM assembly_constituencies
     WHERE LOWER(district_name) = $1 AND LOWER(state_name) = $2`,
    [bestMatch, state.trim().toLowerCase()]
  );

  // ✅ Get parliaments
  const parliaments = await pool.query(
    `SELECT parliament_id, constituency_name 
     FROM parliament_constituencies
     WHERE LOWER(district_name) = $1 AND LOWER(state_name) = $2`,
    [bestMatch, state.trim().toLowerCase()]
  );

  return {
    districtMatched: bestMatch,
    assemblies: assemblies.rows,
    parliaments: parliaments.rows,
  };
}

module.exports = {
  matchDistrictToConstituencies,
};
