import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function ForgotPassword() {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const navigate = useNavigate();

  // Simulate OTP sending
  const handleSendOtp = () => {
    setOtpSent(true);
    alert("OTP sent to your Aadhaar-linked phone number.");
  };

  // Verify OTP (demo = "1234")
  const handleVerifyOtp = () => {
    if (otp === "1234") {
      setIsOtpVerified(true);
      alert("OTP verified successfully.");
    } else {
      alert("Invalid OTP, try again.");
    }
  };

  // Reset password
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!isOtpVerified) {
      alert("Please verify OTP first.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Update user password in localStorage
    let userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      userData.password = newPassword;
      localStorage.setItem("user", JSON.stringify(userData));
      alert("Password reset successful! Please login with your new password.");
      navigate("/login");
    } else {
      alert("No registered user found. Please register first.");
      navigate("/register");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Forgot Password
        </h2>

        <form onSubmit={handleResetPassword}>
          {/* Send OTP */}
          {!otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              Send OTP
            </button>
          )}

          {/* OTP input */}
          {otpSent && !isOtpVerified && (
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
          )}

          {/* Password fields after OTP verified */}
          {isOtpVerified && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                Reset Password
              </button>
            </>
          )}
        </form>

        {/* Links */}
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/" className="text-gray-600 hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

