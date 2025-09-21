import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

// A simple BrandLogo component for display
const BrandLogo = () => (
  <div className="text-4xl font-bold text-indigo-600">
    🗳️
  </div>
);

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/login`, {
        username,
        password,
      });

      // On successful login, store user info and navigate to a dashboard
      alert("Login successful!");
      localStorage.setItem("currentUser", JSON.stringify({ username, ...response.data }));
      navigate("/dashboard"); // Or any other protected route

    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.error || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-sm p-8 space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
          Voter Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full mt-1 border border-gray-300 rounded-lg p-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mt-1 border border-gray-300 rounded-lg p-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="w-full btn bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <p className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-indigo-600 hover:underline">
            Forgot Password?
          </Link>
        </p>

        <p className="mt-2 text-center text-sm">
          Don’t have an account?{" "}
          <Link to= "/register" className="text-indigo-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;