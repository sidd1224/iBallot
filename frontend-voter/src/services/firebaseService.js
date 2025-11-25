import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "firebase/auth";

// Vite exposes environment variables on the `import.meta.env` object.
// Only variables prefixed with VITE_ are exposed to the client-side code for security.
// These variables will be injected by Doppler when you run the container.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Initialize Firebase with the configuration from environment variables.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Sets up the reCAPTCHA verifier required for phone authentication.
 * This function should be called once when the component mounts.
 * @returns {RecaptchaVerifier} A new reCAPTCHA verifier instance.
 */
export const setUpRecaptcha = () => {
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
  
  return new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible'
  });
};

/**
 * Sends an OTP code to the provided phone number using Firebase.
 * @param {string} phoneNumber - The user's full phone number (e.g., +91xxxxxxxxxx).
 * @param {RecaptchaVerifier} verifier - The reCAPTCHA verifier instance.
 * @returns {Promise<ConfirmationResult>} A promise that resolves with the confirmation result object.
 */
export const sendOtp = (phoneNumber, verifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

