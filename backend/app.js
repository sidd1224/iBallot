const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(helmet());
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// --- USER ROUTES ---
app.use("/register", require("./routes/user/register"));
app.use("/digilocker", require("./routes/user/digilocker"));
app.use("/login", require("./routes/user/login"));
app.use("/status", require("./routes/user/status"));
app.use("/vote", require("./routes/user/vote"));

// --- CORRECTED: Use the correct path for dashboard and add candidateList ---
app.use("/dashboard", require("./routes/user/dashboard")); 
app.use("/candidates", require("./routes/user/candidateList"));


// --- Admin Routes ---
app.use("/admin/auth", require("./routes/admin/auth"));
app.use("/admin/elections", require("./routes/admin/elections"));
app.use("/admin/candidates", require("./routes/admin/candidates"));
app.use("/admin/results", require("./routes/admin/results"));
app.use("/admin/eci-data", require("./routes/admin/eciData"));

module.exports = app;
