const Fuse = require("fuse.js");
const pool = require("../database/db"); // PostgreSQL pool

let fuse = null;
let officialDistricts = [];

async function initializeDistrictMatcher() {
  const result = await pool.query("SELECT DISTINCT district_name FROM assembly_constituencies");
  officialDistricts = result.rows.map(r => r.district_name.trim().toLowerCase());

  fuse = new Fuse(officialDistricts, {
    includeScore: true,
    threshold: 0.4
  });
}
async function matchDistrictToAssembly(state, aadhaarDistrict) {
  if (!fuse) await initializeDistrictMatcher();

  const matches = fuse.search(aadhaarDistrict.trim().toLowerCase());
  if (matches.length === 0) return null;

  const bestMatch = matches[0].item;

  // ✅ Use correct column name: assembly_id
  const query = `
    SELECT assembly_id FROM assembly_constituencies
    WHERE LOWER(district_name) = $1 AND LOWER(state_name) = $2
    LIMIT 1
  `;
  const result = await pool.query(query, [bestMatch, state.trim().toLowerCase()]);
  if (result.rows.length === 0) return null;

  return {
    assemblyId: result.rows[0].assembly_id,
    districtMatched: bestMatch
  };
}

module.exports = {
  matchDistrictToAssembly
};
