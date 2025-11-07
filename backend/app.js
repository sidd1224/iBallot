const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();
const rateLimit = require("express-rate-limit");
const userAuth = require("./middleware/userAuth");
const adminAuth = require("./middleware/adminAuth");
const jwt = require("jsonwebtoken");

const app = express();

// --- SECURITY HEADERS ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// --- TRUST PROXY (for X-Forwarded-For with NGINX) ---
app.set("trust proxy", 1);

// --- REQUEST LIMITER (Prevents brute-force login/register attacks) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

// --- MIDDLEWARES ---
app.use(express.json());

// --- STATIC FILES ---
// Serve all static assets
app.use(express.static("public"));

// ✅ Serve candidate symbols specifically via /api/symbols/*
app.use("/api/symbols", express.static("public/symbols"));

// --- CORS CONFIGURATION ---
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://iballot-frontend-admin-715732606815.asia-south1.run.app",
  "https://iballot-frontend-voter-715732606815.asia-south1.run.app",
];

const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim());

console.log("✅ Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow curl, mobile, etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn(`❌ Blocked CORS request from origin: ${origin}`);
      return callback(new Error("CORS not allowed for this origin"), false);
    },
    credentials: true,
  })
);


// --- USER ROUTES ---
// Public routes
app.use("/api/register", authLimiter, require("./routes/user/register"));
app.use("/api/digilocker", require("./routes/user/digilocker"));
app.use("/api/login", authLimiter, require("./routes/user/login"));

// Protected user routes (need token)
app.use("/api/status", userAuth, require("./routes/user/status"));
app.use("/api/vote", userAuth, require("./routes/user/vote"));
app.use("/api/dashboard", userAuth, require("./routes/user/dashboard"));
app.use("/api/candidates", userAuth, require("./routes/user/candidateList"));

// --- ADMIN ROUTES ---
app.use("/admin/auth", authLimiter, require("./routes/admin/auth"));
app.use("/admin/dashboard", adminAuth, require("./routes/admin/data-summary"));
app.use("/admin/elections", adminAuth, require("./routes/admin/elections"));
app.use("/admin/candidates", adminAuth, require("./routes/admin/candidates"));
app.use("/admin/results", adminAuth, require("./routes/admin/results"));
app.use("/admin/eci-data", adminAuth, require("./routes/admin/eciData"));

module.exports = app;
