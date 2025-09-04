// backend/firebase/firebaseAuth.js
const { initializeApp } = require("firebase/app");
const { getAuth, connectAuthEmulator } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "demo-project",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to Firebase Auth Emulator
connectAuthEmulator(auth, "http://localhost:9099");

module.exports = auth;
