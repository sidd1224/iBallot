import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * DigilockerVerify Component
 * Mock external Digilocker verification page
 * Users enter phone number, verify, and get redirected back with UID and DOB
 */
function DigilockerVerify() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return URL from query params
  const returnUrl = new URLSearchParams(location.search).get('returnUrl') || '/register/step1';

  /**
   * Handles phone number verification with mock Digilocker API
   */
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Please enter your phone number.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/digilocker/verify-phone', {
        phoneNumber
      });

      setVerificationData(response.data.data);
      setError('');

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Phone verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles returning to registration page with verification data
   */
  const handleReturnToRegistration = () => {
    if (verificationData) {
      // Redirect back to registration with verification data
      navigate(returnUrl, {
        state: {
          digilockerVerified: true,
          verificationData: verificationData
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-md p-8 space-y-6 transform transition-all hover:scale-[1.01]">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            Digilocker Verification
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Verify your identity to continue registration
          </p>
        </div>

        {!verificationData ? (
          /* Phone Verification Form */
          <form onSubmit={handleVerifyPhone} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Enter your registered phone number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Verify Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : 'Verify Phone Number'}
            </button>
          </form>
        ) : (
          /* Verification Success */
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Verification Successful!</strong>
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Name: {verificationData.name}
                  </p>
                  <p className="text-sm text-green-600">
                    Phone: {verificationData.phoneNumber}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleReturnToRegistration}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Continue to Registration
            </button>
          </div>
        )}

        {/* Back to Registration Link */}
        <p className="mt-4 text-center text-sm text-gray-600">
          <button 
            onClick={() => navigate(returnUrl)}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Registration
          </button>
        </p>
      </div>
    </div>
  );
}

export default DigilockerVerify;
