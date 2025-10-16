const crypto = require("crypto");
const fs = require("fs");

/**
 * Generates a SHA-256 hash of a UID.
 * @param {string} uid - The unique identifier (e.g., Aadhaar UID).
 * @returns {string} - The resulting hex-encoded SHA-256 hash.
 */
function generateUidHash(uid) {
  return crypto.createHash("sha256").update(uid).digest("hex");
}

// --- Configuration ---
const uids = [
  "123456789012", "123456789013", "123456789014", "912598753753",
  "446370025697", "581268199835", "702574619130", "737335420249",
  "286673897992", "597452514229", "294309423977", "961181990388",
  "260452100318", "769304788497", "843627194058", "825125474850",
  "264223047649", "996527430610"
];

// --- Main Program ---
let outputContent = "UID to UID Hash Mappings\n";
outputContent += "==========================\n\n";

uids.forEach(uid => {
  const uidHash = generateUidHash(uid);
  outputContent += `UID: ${uid}\nHash: ${uidHash}\n\n`;
});

// --- UPDATED: Use fs.open ---
const filePath = 'generated_uid_hashes.txt';

fs.open(filePath, 'w', (err, fd) => {
  if (err) {
    console.error("❌ Error opening file:", err);
    return;
  }
  
  fs.writeFile(fd, outputContent, (err) => {
    if (err) {
      console.error("❌ Error writing to file:", err);
    } else {
      console.log(`✅ Successfully generated hashes and saved them to ${filePath}`);
    }
    
    fs.close(fd, (err) => {
      if (err) console.error("❌ Error closing file:", err);
    });
  });
});