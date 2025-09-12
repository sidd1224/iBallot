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

// --- UPDATED USER ROUTES ---
// We now require both of the separate registration files.
// Express will correctly handle the '/start' and '/complete' routes from each file.
app.use("/register", require("./routes/user/register_start"));
app.use("/register", require("./routes/user/register_complete"));

// --- Other routes remain the same ---
app.use("/re-register", require("./routes/user/re-register"));
app.use("/login", require("./routes/user/login"));
app.use("/status", require("./routes/user/status"));
app.use("/vote", require("./routes/user/vote"));
app.use("/candidates", require("./routes/user/candidateList"));


// Admin Routes
app.use("/admin/auth", require("./routes/admin/auth"));
app.use("/admin/elections", require("./routes/admin/elections"));
app.use("/admin/candidates", require("./routes/admin/candidates"));
app.use("/admin/results", require("./routes/admin/results"));

module.exports = app;
