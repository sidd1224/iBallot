module.exports = {
  testEnvironment: "node",
  detectOpenHandles: true,
  testTimeout: 60000, // ✅ helps identify what's keeping Jest open
};
