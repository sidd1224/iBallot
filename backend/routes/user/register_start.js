const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { parseAadhaarXML } = require("../../utils/xmlParser");
const { matchDistrictToConstituencies } = require("../../utils/fuzzyDistrictMatcher");

// --- Multer Configuration for Secure File Uploads ---
// This configuration ensures that uploaded files are stored securely on the server
// with unique, randomized names, preventing path traversal attacks.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define a secure, non-public directory for temporary uploads.
    const uploadPath = path.join(__dirname, '../../adhaar/uploads/');
    // Ensure the destination directory exists.
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent naming conflicts and hide original filenames.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'aadhaar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * @route   POST /register/start
 * @desc    Handles the first step of registration. It securely uploads the Aadhaar
 * XML, validates the user's age, matches their district to constituencies,
 * and returns the necessary data for the second step.
 * @access  Public
 */
router.post("/start", upload.single('aadhaarFile'), async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate that a file was uploaded by multer.
    if (!req.file) {
      return res.status(400).json({ error: "Aadhaar XML file is required." });
    }
    if (!username || !password) {
      // If validation fails after upload, delete the orphaned file.
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Username and password are required." });
    }

    // Use the secure path and filename provided by multer. This is safe.
    const secureFilePath = req.file.path;
    const secureFilename = req.file.filename;

    // Parse the securely uploaded file. Your xmlParser function does not need changes.
    const { dob, state_name, district_name } = parseAadhaarXML(secureFilePath);

    // Validate age based on data from the XML.
    if (!dob) {
        throw new Error("Date of Birth (DOB) not found in Aadhaar XML.");
    }
    const age = getAgeFromDOB(dob);
    if (age < 18) {
      return res.status(403).json({ error: "Voter must be at least 18 years old." });
    }

    // Match the district from the XML to constituencies in your database.
    const matched = await matchDistrictToConstituencies(state_name, district_name);
    if (!matched) {
      return res.status(422).json({ error: `Could not match your district: ${district_name}` });
    }

    // On success, return constituency data and the secure filename for the next step.
    res.status(200).json({
      state_name,
      district_name: matched.districtMatched,
      assemblies: matched.assemblies,
      parliaments: matched.parliaments,
      aadhaarFilename: secureFilename // This is crucial for the /complete step.
    });

  } catch (err) {
    console.error("❌ Register start error:", err);
    // If any error occurs after a file was uploaded, ensure it is cleaned up.
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to start registration", details: err.message });
  }
});

/**
 * Helper function to calculate age from a Date of Birth string (e.g., "YYYY-MM-DD").
 * @param {string} dobStr - The date of birth string.
 * @returns {number} The calculated age in years.
 */
function getAgeFromDOB(dobStr) {
  const dob = new Date(dobStr);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

module.exports = router;
