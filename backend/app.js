const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();
const rateLimit = require('express-rate-limit');
const userAuth = require("./middleware/userAuth"); // Import user authentication middleware

const app = express();
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// --- Create a rate limiter for authentication routes ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false, 
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
});


app.use(express.json());
app.use(express.static('public'));

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// --- PUBLIC USER ROUTES ---
// Apply rate limiting to prevent brute-force attacks
app.use("/register", authLimiter, require("./routes/user/register"));
app.use("/digilocker", require("./routes/user/digilocker"));
app.use("/login", authLimiter, require("./routes/user/login"));

// --- PROTECTED USER ROUTES ---
// Apply user authentication middleware to all routes that require a login
app.use("/status", userAuth, require("./routes/user/status"));
app.use("/vote", userAuth, require("./routes/user/vote"));
app.use("/dashboard", userAuth, require("./routes/user/dashboard")); 
app.use("/api/candidates", userAuth, require("./routes/user/candidateList"));


app.use("/admin/auth", authLimiter, require("./routes/admin/auth"));
app.use("/admin/dashboard", adminAuth, require("./routes/admin/data-summary"));
app.use("/admin/elections", adminAuth, require("./routes/admin/elections"));
app.use("/admin/candidates", adminAuth, require("./routes/admin/candidates"));
app.use("/admin/results", adminAuth, require("./routes/admin/results"));
app.use("/admin/eci-data", adminAuth, require("./routes/admin/eciData"));

module.exports = app;

module.exports = app;