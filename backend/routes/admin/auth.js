const express = require("express");
const router = express.Router();

// POST /admin/auth/login
router.post("/login", (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bodyToken = req.body?.token;

    let token = null;

    // Prioritize token in Authorization header
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim(); // Safer than split
    } else if (bodyToken) {
      token = bodyToken;
    }

    if (!token) {
      return res.status(400).json({ success: false, error: "Token is required" });
    }

    if (token === process.env.ADMIN_TOKEN) {
      return res.status(200).json({ success: true, message: "Admin authenticated" });
    }

    return res.status(401).json({ success: false, error: "Invalid admin token" });
  } catch (err) {
    console.error("🔥 Auth error:", err.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ MUST be exported to be usable
module.exports = router;
