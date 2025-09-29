// hash_uids.js
const fs = require("fs");
const crypto = require("crypto");
const { exec } = require("child_process");

// UIDs copied from your dump.sql
const uids = [
  "123456789012",
  "123456789013",
  "123456789014",
  "123456789015",
  "123456789016",
  "123456789017",
  "123456789018",
  "987654321019",
  "123456789020",
  "123456789021",
  "987654321022",
  "987654321023",
];

function hashUID(uid) {
  return crypto.createHash("sha256").update(uid).digest("hex");
}

// Build file content
const output = uids.map(uid => `${uid} -> ${hashUID(uid)}`).join("\n");

const filePath = "uid_hashes.txt";
fs.writeFileSync(filePath, output);

console.log(`✅ Hashes written to ${filePath}`);

// Auto-open file after writing
if (process.platform === "win32") {
  exec(`start notepad ${filePath}`);
} else if (process.platform === "darwin") {
  exec(`open ${filePath}`);
} else {
  exec(`xdg-open ${filePath}`);
}
