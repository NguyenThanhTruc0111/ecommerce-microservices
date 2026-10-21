const fs = require("node:fs");
const path = require("node:path");
const loader = require("@grpc/proto-loader");

const protoDir = path.join(__dirname, "proto");

const files = fs.readdirSync(protoDir)
  .filter(file => file.endsWith(".proto"));

if (files.length !== 5) {
  console.error(`FAIL: Cần 5 file proto, hiện có ${files.length}.`);
  process.exitCode = 1;
}

for (const file of files) {
  try {
    loader.loadSync(path.join(protoDir, file));
    console.log(`PASS: ${file}`);
  } catch (error) {
    console.error(`FAIL: ${file} - ${error.message}`);
    process.exitCode = 1;
  }
}