import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ReRegister() {
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarUploaded, setAadhaarUploaded] = useState(false);
  const [parliamentAssembly, setParliamentAssembly] = useState("");
  const [stateAssembly, setStateAssembly] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Aadhaar upload
  const handleFileChange = (e) => {
    setAadhaarFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!aadhaarFile) {
      alert("Please select Aadhaar XML file first.");
      return;
    }
    if (!aadhaarFile.name.endsWith(".xml")) {
      alert("Only XML files are allowed.");
      return;
    }
    setAadhaarUploaded(true);
    alert("Aadhaar XML uploaded successfully.");
  };

  // OTP flow
  const handleGetOtp = () => {
    if (!aadhaarUploaded) {
      alert("Upload Aadhaar XML first.");
      return;
    }
    setOtpSent(true);
    alert("OTP sent to Aadhaar-linked phone (demo OTP: 1234).");
  };

  const handleVerifyOtp = () => {
    if (otp === "1234") {
      setIsOtpVerified(true);
      alert("OTP verified successfully.");
    } else {
      alert("Invalid OTP. Try again.");
    }
  };

  // Re-Register
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!aadhaarUploaded) {
      alert("Please upload Aadhaar XML first.");
      return;
    }
    if (!isOtpVerified) {
      alert("Please verify OTP before re-registering.");
      return;
    }
    if (!password) {
      alert("Password is required.");
      return;
    }

    const userData = {
      aadhaarFileName: aadhaarFile.name,
      parliamentAssembly,
      stateAssembly,
      password,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    alert("Re-Registration successful! Please login.");
    navigate("/login");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Re-Register
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Aadhaar Upload */}
          <div className="mb-4">
            <label className="block text-gray-700">Upload Aadhaar XML</label>
            <input
              type="file"
              accept=".xml"
              className="w-full p-2 border rounded-lg"
              onChange={handleFileChange}
              required
            />
            <button
              type="button"
              onClick={handleUpload}
              className="mt-2 w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              Upload
            </button>
          </div>

          {/* Parliament Assembly */}
          <div className="mb-4">
            <label className="block text-gray-700">
              Parliament Assembly Constituency
            </label>
            <select
              className="w-full p-2 border rounded-lg"
              value={parliamentAssembly}
              onChange={(e) => setParliamentAssembly(e.target.value)}
              disabled={!aadhaarUploaded}
              required
            >
              <option value="">Select Parliament Assembly</option>
              <option value="Bangalore South">Bangalore South</option>
              <option value="Bangalore North">Bangalore North</option>
              <option value="Mysore">Mysore</option>
            </select>
          </div>

          {/* State Assembly */}
          <div className="mb-4">
            <label className="block text-gray-700">
              State Legislative Assembly Constituency
            </label>
            <select
              className="w-full p-2 border rounded-lg"
              value={stateAssembly}
              onChange={(e) => setStateAssembly(e.target.value)}
              disabled={!aadhaarUploaded}
              required
            >
              <option value="">Select State Assembly</option>
              <option value="Chamrajpet">Chamrajpet</option>
              <option value="Shivajinagar">Shivajinagar</option>
              <option value="Chikmagalur">Chikmagalur</option>
            </select>
          </div>

          {/* OTP */}
          {otpSent && (
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

          {/* Get OTP */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGetOtp}
              className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              Get OTP
            </button>
          </div>

          {/* Password */}
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

          {/* Re-Register */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            Re-Register
          </button>
        </form>

        {/* Links */}
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
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

export default ReRegister;




