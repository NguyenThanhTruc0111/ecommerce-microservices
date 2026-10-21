require("dotenv").config({
  path: require("node:path").join(__dirname, ".env")
});

const pool = require("./src/infrastructure/database");

async function checkDatabase() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );

    console.log("PASS: Connected to", result.rows[0].database);
  } catch (error) {
    console.error("FAIL:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabase();