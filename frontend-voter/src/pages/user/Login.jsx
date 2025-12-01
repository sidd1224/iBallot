import React, { useState } from 'react';
import { Shield, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useVerification } from '../../context/VerificationContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const { username, setUsername, password, setPassword } = useVerification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`/api/login`, {
        username,
        password,
      });

      console.log("✅ Login Response:", response.data);

      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem(
        'user',
        JSON.stringify({
          username: response.data.user.username,
          hasVoted: response.data.hasVoted
        })
      );
      sessionStorage.setItem('voterHash', response.data.voterHash);
      sessionStorage.setItem('walletAddress', response.data.walletAddress);
      sessionStorage.setItem('constituency', JSON.stringify(response.data.constituency));

      toast.success("Login successful! Redirecting...");

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      console.error("❌ Login Error:", err.response || err);
      setError(errMsg);
      toast.error(errMsg);
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Responsive Fix: Adjusted Padding */}
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

        {/* Top Logo Section */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>

          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">Voter Login</h2>
          <p className="mt-2 text-sm text-gray-600">Securely access the ballot box</p>
        </div>

        {/* Main Card */}
        <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 rounded-2xl sm:px-10 border border-gray-100">

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm">
                <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    disabled={loading}
                    // Responsive Fix: text-base
                    className="block w-full pl-10 text-base sm:text-sm border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    disabled={loading}
                    // Responsive Fix: text-base
                    className="block w-full pl-10 text-base sm:text-sm border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {/* ✅ Added Forgot Password Link Here */}
                <div className="flex justify-end text-sm mt-1">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Register Link */}
              <div className="flex justify-end text-sm">
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Don't have an account?
                </Link>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Logging in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Badges */}
          <div className="mt-8 text-center space-x-4">
            <span className="inline-flex items-center text-xs text-gray-500">
              <Lock className="h-3 w-3 mr-1" /> SSL Secured
            </span>
            <span className="inline-flex items-center text-xs text-gray-500">
              <CheckCircle className="h-3 w-3 mr-1" /> Blockchain Verified
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;