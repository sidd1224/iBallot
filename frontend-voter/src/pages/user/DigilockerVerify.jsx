import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // <-- Added Link
import { useVerification } from '../../context/VerificationContext'; 
import BrandLogo from '../../components/BrandLogo'; 
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function DigilockerVerify() {
  const {
    // username is no longer needed on this page
    phoneNumber, setPhoneNumber, 
    setVerificationData,
    setIsVerified
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

    // <-- REMOVED the 'if (!username)' check
    
    setLoading(true);

    try {
      // CHANGED: Endpoint and payload now match the backend
      const response = await axios.post(`/api/digilocker/verify-phone`, { 
        phoneNumber // Only send the phone number
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
    } catch (err)
 {
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
      {/* CHANGED: Reduced vertical padding on mobile (py-6) 
        and kept it larger for screens 'sm' and up (sm:py-12)
      */}
      <div className="flex min-h-screen items-center justify-center bg-gray-100 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <BrandLogo />
          
          {/* CHANGED: Reduced padding (p-6) and shadow on mobile.
            Kept larger padding (sm:p-8) and shadow for 'sm' and up.
            Also made rounding consistent with 'rounded-lg'.
          */}
          <div className="bg-white p-6 sm:p-8 shadow-md sm:shadow-xl rounded-lg space-y-6">
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
