const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken'); // Import the jsonwebtoken library

// POST /admin/auth/login
router.post("/login", (req, res) => {
  try {
    // The token from the login form is the static ADMIN_TOKEN
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: "Token is required" });
    }

    // 1. Verify the static admin token once
    if (token === process.env.ADMIN_TOKEN) {
      
      // --- NEW: Create a secure, temporary JWT ---
      const payload = { role: 'admin' }; // The payload identifies this user as an admin
      const adminJwt = jwt.sign(
        payload, 
        process.env.JWT_SECRET, // A secret key stored in your Doppler environment
        { expiresIn: '1h' } // The token will automatically expire in 1 hour
      );

      // 2. Send the new JWT back to the admin
      return res.status(200).json({ 
        success: true, 
        message: "Admin authenticated successfully",
        token: adminJwt // The frontend will use this token for future requests
      });
    }

    // If the static token is wrong, deny access
    return res.status(401).json({ success: false, error: "Invalid admin token" });
  
  } catch (err) {
    console.error("🔥 Auth error:", err.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;