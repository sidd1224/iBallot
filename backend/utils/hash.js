const crypto = require("crypto");
const fs = require("fs");

function generateUidHash(uid) {
  return crypto.createHash("sha256").update(uid).digest("hex");
}

const inputFile = "uids.csv"; // the file containing 100 UIDs
const outputFile = "generated_uid_hashes.txt";

fs.readFile(inputFile, "utf8", (err, data) => {
  if (err) {
    console.error("❌ Error reading input file:", err);
    return;
  }

  const uids = data.split(/\r?\n/).filter(line => line.trim() !== "");
  let outputContent = "UID to UID Hash Mappings\n==========================\n\n";

  uids.forEach(uid => {
    const hash = generateUidHash(uid);
    outputContent += `UID: ${uid}\nHash: ${hash}\n\n`;
  });

  fs.writeFile(outputFile, outputContent, (err) => {
    if (err) console.error("❌ Error writing file:", err);
    else console.log(`✅ Generated ${uids.length} hashes and saved to ${outputFile}`);
  });
});
