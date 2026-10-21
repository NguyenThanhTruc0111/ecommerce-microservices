const path = require("node:path");
const fs = require("node:fs");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const pool = require("./src/infrastructure/database");

async function initializeDatabase() {
  let client;

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "src/infrastructure/schema.sql"),
      "utf8"
    );

    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    const result = await client.query(
      "SELECT roleid, rolename FROM roles ORDER BY roleid"
    );

    console.log("PASS: Auth database initialized");
    console.table(result.rows);
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("FAIL:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

initializeDatabase();