// hash_generator.js
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process'); // for opening file

// Replace these with your test users' UIDs
const uids = [
  '123456789012',
  '123456789013',
  '123456789014',
  '123456789015',
  '123456789016',
  '123456789017',
  '123456789018',
  '123456789019',
  '123456789020',
  '123456789021',
  '987654321022',
  '987654321023'
];

// Output file
const outputFile = 'hashed_uids.txt';

const hashedData = uids.map(uid => {
  const hash = crypto.createHash('sha256').update(uid).digest('hex');
  return `${uid},${hash}`;
}).join('\n');

fs.writeFileSync(outputFile, hashedData);

console.log(`SHA-256 hashes generated and saved to ${outputFile}`);

// Open the file (works on Windows, Mac, Linux)
const openCommand = process.platform === 'win32' ? `start ${outputFile}` :
                    process.platform === 'darwin' ? `open ${outputFile}` :
                    `xdg-open ${outputFile}`;

exec(openCommand, (err) => {
  if (err) {
    console.error('Failed to open file:', err);
  }
});
