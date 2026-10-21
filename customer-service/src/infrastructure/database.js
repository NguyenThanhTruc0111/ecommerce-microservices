const { Pool } = require("pg");

const pool = new Pool({
  connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
  console.error("Customer PostgreSQL error:", error.message);
});

module.exports = pool;