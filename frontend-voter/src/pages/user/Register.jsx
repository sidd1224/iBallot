import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVerification } from '../../context/VerificationContext';
import BrandLogo from '../../components/BrandLogo';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const {
    username, setUsername,
    password, setPassword,
    phoneNumber, // Get phone from context (set by other page)
    verificationData, // Get Digilocker data from context
    isVerified // Get the "green tick" status
  } = useVerification();
  
  // This state is only for this page
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Final registration submit
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
        username, // Aadhaar
        password,
        phoneNumber,
        digilockerData: verificationData // The data we got from the verify page
      };

      const response = await axios.post(`${apiUrl}/api/register`, registrationData);

      if (response.data.message) { // Use message for success
        toast.success("Registration successful! Redirecting to login...");
        setTimeout(() => navigate('/login'), 2000);
      } else {
         setError(response.data.error || 'Registration failed.');
         toast.error(response.data.error || 'Registration failed.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'An error occurred.';
      setError(`Registration failed: ${errMsg}`);
      toast.error(`Registration failed: ${errMsg}`);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <BrandLogo />
          
          <div className="bg-white p-8 shadow-xl rounded-lg">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 mb-6">
              Create Account
            </h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            
            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter username"
                  disabled={loading || isVerified} // Disable if verified
                />
              </div>

              <div>
                <label htmlFor="password">Create Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Create a strong password"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>

              {/* --- CONDITIONAL VERIFICATION BUTTON --- */}
              {!isVerified ? (
                <Link
                  to="/verify/digilocker"
                  className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${loading ? 'bg-gray-400' : ''}`}
                  aria-disabled={loading}
                  onClick={(e) => loading && e.preventDefault()} // Prevent navigation if loading
                >
                  Verify via Digilocker
                </Link>
              ) : (
                <div className="mt-4 w-full flex justify-center py-2 px-4 border border-green-500 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-100">
                  Verified ✔
                </div>
              )}
              {/* --- END CONDITIONAL BUTTON --- */}
              
              <button
                type="submit"
                disabled={loading || !isVerified} // Disable until verified
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;

