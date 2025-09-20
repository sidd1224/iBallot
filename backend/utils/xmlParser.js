const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");
const { DOMParser } = require("@xmldom/xmldom");
const { SignedXml } = require("xml-crypto");
const forge = require("node-forge");

/**
 * Parses and validates an Aadhaar XML file, including its digital signature.
 * @param {string} filePath - The path to the uploaded Aadhaar XML file.
 * @returns {object} An object containing validated user data.
 * @throws {Error} If the file is invalid, tampered, or missing data.
 */
function parseAadhaarXML(filePath) {
  try {
    const xmlData = fs.readFileSync(filePath, "utf-8");

    // --- Step 1: Parse the full XML to locate data and signature ---
    const fastParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const jsonObj = fastParser.parse(xmlData);
    
    const kycRes = jsonObj?.KycRes;
    const uidData = kycRes?.UidData;
    const poi = uidData?.Poi; // Proof of Identity
    const poa = uidData?.Poa; // Proof of Address
    
    if (!kycRes || !uidData || !poi || !poa) {
        throw new Error("XML structure is invalid or missing essential KycRes/UidData tags.");
    }
    
    // --- Step 2: Digital Signature Validation ---
    // We must provide 'text/xml' as the mimeType for the server-side parser.
    const doc = new DOMParser().parseFromString(xmlData, 'text/xml');
    const signatureNode = doc.getElementsByTagName("Signature")[0];
    if (!signatureNode) throw new Error("Digital signature is missing.");

    const certNode = signatureNode.getElementsByTagName("X509Certificate")[0];
    if (!certNode || !certNode.firstChild) throw new Error("Certificate is missing.");
    
    const certBase64 = certNode.firstChild.nodeValue.trim();
    const certPem = formatCert(certBase64);

    const sig = new SignedXml();
    sig.keyInfoProvider = { getKey: () => certPem };
    sig.loadSignature(signatureNode);
    const isValid = sig.checkSignature(xmlData);

    if (!isValid) {
      console.error("Signature validation failed:", sig.validationErrors);
      throw new Error("Aadhaar XML signature is invalid or tampered.");
    }

    // --- Step 3: Extract Data (from the already parsed object) ---
    const reference_id = kycRes["@_code"]; 
    const uid = uidData["@_uid"]; 
    const dob = poi["@_dob"];
    const state_name = poa["@_state"];
    const district_name = poa["@_dist"];
    
    if (!reference_id || !uid || !dob || !state_name || !district_name) {
        throw new Error("One or more essential data attributes are missing.");
    }

    return {
      reference_id,
      uid,
      dob,
      state_name,
      district_name,
    };

  } catch (err) {
    console.error("❌ Error during Aadhaar XML processing:", err.message);
    throw new Error("Invalid or tampered Aadhaar XML");
  }
}

function formatCert(certBase64) {
  return (
    "-----BEGIN CERTIFICATE-----\n" +
    certBase64.match(/.{1,64}/g).join("\n") +
    "\n-----END CERTIFICATE-----"
  );
}

module.exports = { parseAadhaarXML };

