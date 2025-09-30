import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useVerification } from '../../context/VerificationContext.jsx';

/**
 * Register Component
 * First step: username + Digilocker verification
 * Second step: password + complete registration
 */
function Register() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Use context for username and verification
 const { username, setUsername, isVerified, setIsVerified, verificationData, setVerificationData } = useVerification();


  // -------------------- UPDATE --------------------
  // Populate username and verified status on return from Digilocker
  useEffect(() => {
  if (location.state?.digilockerVerified && location.state?.verificationData) {
    // Set username if empty
    if (!username) setUsername(location.state?.username || '');
    // Mark user as verified
    setIsVerified(true);

    // Keep verificationData in context for backend, but do NOT display it in UI
    setVerificationData(location.state.verificationData);
  }
}, [location.state]);

  // -------------------- END UPDATE --------------------

  /**
   * Redirect to Digilocker verification page
   */
  const handleVerifyViaDigilocker = (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your username first.');
      return;
    }
    const returnUrl = encodeURIComponent('/register');
    navigate(
      `/digilocker/verify?returnUrl=${returnUrl}&username=${encodeURIComponent(username)}`
    );
  };

  /**
   * Complete registration after verification
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isVerified) {
      setError('Please verify via Digilocker first.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/register`, {
  username,
  password,
  phoneNumber: verificationData.phoneNumber, // backend gets it
  // You can include other required fields here
});


      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-md p-8 space-y-6 transform transition-all hover:scale-[1.01]">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Create Your Account</h2>
          <p className="text-sm text-gray-500 mt-2">Step 1 of 2: Verify via Digilocker</p>
        </div>

        {/* Username Input */}
        <form onSubmit={handleVerifyViaDigilocker} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Choose a unique username"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
            />
          </div>

          {/* Verification Button / Status */}
          {isVerified ? (
            <div className="flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 transition-colors">
              ✅ Verified via Digilocker
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              Verify via Digilocker
            </button>
          )}
        </form>

        {/* Registration Form */}
        {isVerified && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                    <p className="text-sm text-green-600 mt-1">Redirecting to login...</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        )}

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
