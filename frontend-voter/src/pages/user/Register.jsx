import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle, User, ExternalLink, ArrowLeft } from 'lucide-react';
import { useVerification } from '../../context/VerificationContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = ({ onViewChange }) => {
  const {
    username, setUsername,
    password, setPassword,
    phoneNumber,
    verificationData,
    isVerified
  } = useVerification();

  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isVerified) {
      setError('Please verify your identity via Digilocker first.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!username || !password || !phoneNumber || !verificationData) {
      setError("Missing verification data. Please try the verification process again.");
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        username,
        password,
        phoneNumber,
        digilockerData: verificationData
      };

      const response = await axios.post(`/api/register`, registrationData);

      if (response.data.message) {
        toast.success("Registration successful! Redirecting to login...");
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.error || 'Registration failed.');
        toast.error(response.data.error || 'Registration failed.');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = err.response.data.errors[0].msg;
        setError(`Registration failed: ${firstError}`);
        toast.error(`Registration failed: ${firstError}`);
      } else {
        const errMsg = err.response?.data?.error || err.message || 'An error occurred.';
        setError(`Registration failed: ${errMsg}`);
        toast.error(`Registration failed: ${errMsg}`);
      }
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

        {/* Header / Logo */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div
            className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg transform hover:scale-105 transition-transform"
            onClick={() => {
              if (onViewChange) onViewChange('landing');
            }}
          >
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join the secure voting platform</p>
        </div>

        {/* Card Container */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 rounded-2xl sm:px-10 border border-gray-100">

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleRegister}>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                    disabled={loading || isVerified}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Create Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                  />
                </div>
              </div>

              {/* DigiLocker Verification UI */}
              <div className="pt-2">
                {!isVerified ? (
                  <Link
                    to="/verify/digilocker"
                    onClick={(e) => loading && e.preventDefault()}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-blue-200 rounded-xl shadow-sm text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                      loading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Verify via DigiLocker
                  </Link>
                ) : (
                  <div className="w-full flex items-center justify-center px-4 py-3 border border-green-200 rounded-xl shadow-sm text-sm font-semibold text-green-700 bg-green-50 cursor-default animate-in fade-in zoom-in duration-300">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Identity Verified
                  </div>
                )}
              </div>

              {/* Register Submit */}
              <button
                type="submit"
                disabled={loading || !isVerified}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-all ${
                  loading || !isVerified
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  if (onViewChange) onViewChange('login');
                  else navigate('/login');
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </div>
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

export default Register;
