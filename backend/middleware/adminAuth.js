module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === process.env.ADMIN_TOKEN) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};