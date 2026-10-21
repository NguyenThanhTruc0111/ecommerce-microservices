const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const pool = require("./infrastructure/database");
const { startGrpcServer } = require("./interfaces/grpc-server");

async function main() {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  await pool.query("SELECT 1");
  console.log("Auth PostgreSQL connected");

  await startGrpcServer();
}

main().catch(async (error) => {
  console.error("Auth startup failed:", error.message);
  await pool.end();
  process.exitCode = 1;
});