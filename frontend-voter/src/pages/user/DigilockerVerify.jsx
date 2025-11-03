import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useVerification } from '../../context/VerificationContext'; // Corrected path
import BrandLogo from '../../components/BrandLogo'; // Corrected path
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function DigilockerVerify() {
  const {
    username, // Get username (Aadhaar) from context
    phoneNumber, setPhoneNumber, // Get and set phone number in context
    setVerificationData,
    setIsVerified
  } = useVerification();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError("Please enter your phone number.");
      toast.error("Please enter your phone number.");
      return;
    }

    if (!username) {
       setError("Username (Aadhaar) is missing. Please go back to the register page and enter it first.");
       toast.error("Aadhaar is missing. Please go back.");
       return;
    }

    setLoading(true);

    try {
      // Call the backend /api/verify/digilocker route
      // This route should check both Aadhaar (username) and phone
      const response = await axios.post(`${apiUrl}/api/verify/digilocker`, { 
        username, // The Aadhaar from context
        phoneNumber // The phone number from this page
      });

      if (response.data.success) {
        toast.success("Verification successful! Returning to registration...");
        // Save the successful verification data to the context
        setVerificationData(response.data.data); // Save the verified data
        setIsVerified(true); // Set the "green tick" status
        
        // Navigate back to the register page
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
      <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <BrandLogo />
          
          <div className="bg-white p-8 shadow-2xl rounded-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Verify Your Phone
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter the phone number associated with your Aadhaar for verification.
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleVerify}>
              {/* Phone Number Input */}
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone-number"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}

              {/* Verify Button (no OTP, as requested) */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>

            <div className="text-center text-sm">
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                &larr; Back to Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DigilockerVerify;

