const express = require("express");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
app.use(helmet());
app.use(express.json());

// User Routes
app.use("/register", require("./routes/user/register"));
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
