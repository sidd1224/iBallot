const admin = require("firebase-admin");

let credentials;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  credentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else {
  // fallback to serviceAccountKey.json if env not provided (for local dev)
  credentials = require("../serviceAccountKey.json");
}

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

// ✅ Emulator support (don't touch this block as requested)
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"; // or your emulator host
  admin.auth().app.options.credential = {
    getAccessToken: async () => ({
      access_token: "owner",
      expires_in: 3600,
    }),
  };
}

module.exports = admin;
