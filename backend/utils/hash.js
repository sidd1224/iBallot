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
// ✅ All 100 UID values from your digilocker_mock_data
const uids = [
  "729401853612", // Harshitha H D
  "284950173648", // Gagana Deepa
  "910283746501", // Pallavi
  "564738291048", // Adarsh Moras
  "382910475629", // Shalini I S
  "847563920174", // Shilpa K V
  "638291047582", // Thayaba Nausheen A
  "192837465091", // Ramya
  "501928374652", // Rao Siddharth Shankar
  "475829103647", // Darshith C
  "928374651029"  // Chandana M
];

// --- Main Program ---
let outputContent = "UID to UID Hash Mappings\n";
outputContent += "==========================\n\n";

uids.forEach(uid => {
  const uidHash = generateUidHash(uid);
  outputContent += `UID: ${uid}\nHash: ${uidHash}\n\n`;
});

// --- Write output to file ---
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