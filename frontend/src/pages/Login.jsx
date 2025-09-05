// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [aadharLast4, setAadharLast4] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // demo: send OTP (in production call your backend)
  const handleGetOtp = () => {
    setOtpSent(true);
    // in dev show the demo OTP in console (for easier testing)
    console.log("Demo OTP is: 1234");
    alert("OTP sent to Aadhaar-linked phone number (demo OTP = 1234).");
  };

  // demo OTP verify
  const handleVerifyOtp = () => {
    if (otp === "1234") {
      setIsOtpVerified(true);
      alert("OTP verified successfully.");
    } else {
      alert("Invalid OTP. Try again.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();

    // load stored user
    const storedRaw = localStorage.getItem("user");
    if (!storedRaw) {
      alert("No registered user found. Please register first.");
      navigate("/register");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedRaw);
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      alert("Saved user data is corrupted. Please re-register.");
      navigate("/register");
      return;
    }

    // require OTP verified
    if (!isOtpVerified) {
      alert("Please verify OTP before logging in.");
      return;
    }

    // check password
    if (String(user.password || "") !== String(password || "")) {
      // password mismatch -> offer forgot-password
      alert("Incorrect password. If you forgot your password, use Forgot Password.");
      return;
    }

    // if stored user contains aadhaarLast4, enforce it; otherwise skip (backwards compatible)
    if (user.aadharLast4) {
      if (String(user.aadharLast4) !== String(aadharLast4)) {
        alert("Aadhaar last 4 digits do not match our records.");
        return;
      }
    } else {
      // stored user doesn't have last4 — optionally accept any or warn
      console.log("Stored user has no aadhaarLast4 field; skipping last-4 check.");
    }

    // all checks passed
    alert("Login successful!");
    // set current user marker if you use it (optional)
    localStorage.setItem("currentUser", user.phone || user.aadharFileName || "user");
    navigate("/dashboard");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Login</h2>

        <form onSubmit={handleLogin}>
          {/* OTP - send / verify */}
          {!otpSent ? (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGetOtp}
                className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
              >
                Get OTP
              </button>
            </div>
          ) : !isOtpVerified ? (
            <div className="mb-4">
              <label className="block text-gray-700">Enter OTP</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="mt-2 w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
              >
                Verify OTP
              </button>
            </div>
          ) : null}

          {/* After OTP verified ask for Aadhaar last 4 and password */}
          {isOtpVerified && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Aadhaar Last 4 Digits</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={aadharLast4}
                  onChange={(e) => setAadharLast4(e.target.value.replace(/\D/g, ""))}
                  maxLength={4}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                Login
              </button>
            </>
          )}
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-red-500 hover:underline">
            Forgot Password?
          </Link>
        </p>

        <p className="mt-2 text-center text-sm">
          Don’t have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>

        <p className="mt-2 text-center text-sm">
          <Link to="/" className="text-gray-600 hover:underline">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}




