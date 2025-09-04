const crypto = require("crypto");

/**
 * Generates a unique voter hash using Aadhaar reference ID and a secret salt.
 * @param {string} referenceId - Aadhaar reference ID from XML.
 * @param {string} secret - Secret salt from environment.
 * @returns {string} - Hex-encoded SHA-256 hash.
 */
function generateVoterHash(referenceId, secret) {
  const input = `${referenceId}${secret}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

module.exports = { generateVoterHash };
