const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});



// ✅ Only log connection outside of test environment
if (process.env.NODE_ENV !== "test") {
  pool.connect()
    .then(client => {
      console.log("✅ Connected to PostgreSQL");
      client.release();
    })
    .catch(err => {
      console.error("❌ PostgreSQL connection error:", err.message);
      process.exit(1);
    });
}

module.exports = pool;
