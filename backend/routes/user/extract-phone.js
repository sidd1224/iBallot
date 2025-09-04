const express = require("express");
const router = express.Router();
const path = require("path");
const { parseAadhaarXML } = require("../../utils/xmlParser");

router.post("/", (req, res) => {
  try {
    const { aadhaarFilePath } = req.body;

    if (!aadhaarFilePath) {
      return res.status(400).json({ error: "Missing Aadhaar file path" });
    }

    const xmlPath = path.join(__dirname, `../../adhaar/${aadhaarFilePath}`);
    const { phone } = parseAadhaarXML(xmlPath);

    if (!phone) {
      return res.status(422).json({ error: "Phone number not found in Aadhaar XML" });
    }

    res.status(200).json({ phone });
  } catch (err) {
    console.error("❌ Error extracting phone:", err.message);
    res.status(500).json({ error: "Failed to extract phone from Aadhaar XML" });
  }
});

module.exports = router;
