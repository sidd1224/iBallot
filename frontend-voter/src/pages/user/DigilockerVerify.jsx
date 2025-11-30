import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useVerification } from '../../context/VerificationContext';
// Removed unused BrandLogo import if it's not being used or provided
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Shield, Lock, AlertCircle, CheckCircle, ExternalLink, Phone, ArrowLeft } from 'lucide-react';

function DigilockerVerify({ onViewChange }) {
  const {
    phoneNumber, setPhoneNumber,
    setVerificationData,
    setIsVerified,
  } = useVerification();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError("Please enter your phone number.");
      toast.error("Please enter your phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`/api/digilocker/verify-phone`, {
        phoneNumber
      });

      if (response.data.success) {
        toast.success("Verification successful! Returning to registration...");
        setVerificationData(response.data.data);
        setIsVerified(true);

        setTimeout(() => navigate('/register'), 2000);
      } else {
        setError(response.data.error || 'Verification failed. Please check your details.');
        toast.error(response.data.error || 'Verification failed.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'An unknown error occurred.';
      setError(errMsg);
      toast.error(errMsg);
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Responsive Fix: Adjusted Padding */}
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

        {/* HEADER SECTION */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg transform hover:scale-105 transition-transform"
            onClick={() => (onViewChange ? onViewChange('landing') : null)}
          >
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>

          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">Identity Verification</h2>
          <p className="mt-2 text-sm text-gray-600">Verify your identity securely via DigiLocker</p>
        </div>

        {/* MAIN CARD */}
        <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-blue-100/50 rounded-2xl sm:px-10 border border-gray-100 text-center">

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm text-left">
                <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleVerify}>
              {/* Phone Input */}
              <div className="text-left">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>

                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    // Responsive Fix: text-base
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 text-base sm:text-sm border-gray-300 rounded-xl p-3 border transition-all"
                    placeholder="Enter your Aadhaar linked mobile"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Submit Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center px-4 py-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5 ${
                  loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Verifying...' : <><ExternalLink className="mr-2 h-5 w-5" /> Connect with DigiLocker</>}
              </button>
            </form>

            {/* CANCEL BUTTON */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <button
                onClick={() => (onViewChange ? onViewChange('register') : navigate('/register'))}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center w-full transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cancel Verification
              </button>
            </div>

            {/* BOTTOM BADGES */}
            <div className="mt-6 text-center space-x-4">
              <span className="inline-flex items-center text-xs text-gray-500">
                <Lock className="h-3 w-3 mr-1" /> Govt. Integration
              </span>
              <span className="inline-flex items-center text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 mr-1" /> 100% Secure
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default DigilockerVerify;