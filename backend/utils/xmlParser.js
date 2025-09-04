const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");
const { DOMParser } = require("@xmldom/xmldom");
const { SignedXml } = require("xml-crypto");
const forge = require("node-forge");

function parseAadhaarXML(filePath) {
  try {
    if (!filePath.endsWith(".xml")) {
      throw new Error("Only XML files are supported");
    }

    const xmlData = fs.readFileSync(filePath, "utf-8");

    // DOM for signature validation
    const doc = new DOMParser().parseFromString(xmlData);
    const signatureNode = doc.getElementsByTagName("Signature")[0];

    if (!signatureNode) {
      throw new Error("No digital signature found in Aadhaar XML");
    }

    // Extract certificate from Signature
    const certNode = signatureNode.getElementsByTagName("X509Certificate")[0];
    if (!certNode || !certNode.firstChild) {
      throw new Error("Certificate missing in signature block");
    }
    const certBase64 = certNode.firstChild.nodeValue.trim();
    const certPem = formatCert(certBase64);

    // Signature validation using extracted cert
    const signature = new SignedXml();
    signature.keyInfoProvider = {
      getKeyInfo: () => null,
      getKey: () => certPem
    };

    signature.loadSignature(signatureNode);
    const isValid = signature.checkSignature(xmlData);

    if (!isValid) {
      console.error("Signature validation failed:", signature.validationErrors);
      throw new Error("Aadhaar XML signature is invalid or tampered");
    }

    // ✅ Extra: Parse issuer of the certificate
    const certDer = forge.util.decode64(certBase64);
    const asn1 = forge.asn1.fromDer(certDer);
    const cert = forge.pki.certificateFromAsn1(asn1);

    const issuer = cert.issuer.attributes.map(attr => `${attr.name}=${attr.value}`).join(", ");
    const subject = cert.subject.attributes.map(attr => `${attr.name}=${attr.value}`).join(", ");

    // Optional: Load NICSubCA4.pem if you want to verify issuer
    let issuerVerified = null;
    try {
      const nicPem = fs.readFileSync("uidai_auth_prod.pem", "utf-8");
      const nicCert = forge.pki.certificateFromPem(nicPem);
      issuerVerified = nicCert.verify(cert);
    } catch (e) {
      issuerVerified = false;
    }

    // ✅ Now parse metadata
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const jsonObj = parser.parse(xmlData);
    const referenceId = jsonObj?.KycRes?.["@_code"];
    const phone = jsonObj?.KycRes?.UidData?.Poi?.["@_phone"] || null;
    const dob = jsonObj?.KycRes?.UidData?.Poi?.["@_dob"] || null;

    if (!referenceId) {
      throw new Error("Missing Aadhaar reference ID");
    }

    return {
      reference_id: referenceId,
      phone,
      dob,
      certificate_issuer: issuer,
      certificate_subject: subject,
      issuer_verified: issuerVerified,
    };

  } catch (err) {
    console.error("❌ Error parsing Aadhaar XML:", err.message);
    throw new Error("Invalid or tampered Aadhaar XML");
  }
}

// Helper to convert base64 cert to PEM
function formatCert(certBase64) {
  return (
    "-----BEGIN CERTIFICATE-----\n" +
    certBase64.match(/.{1,64}/g).join("\n") +
    "\n-----END CERTIFICATE-----"
  );
}

module.exports = { parseAadhaarXML };
