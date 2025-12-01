import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Shield, CheckCircle, ArrowLeft, Key, ExternalLink } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve state passed back from DigilockerVerify
  const isVerified = location.state?.verified || false;
  const verifiedPhone = location.state?.verifiedPhone || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (e) => {
    e.preventDefault();

    // 1. If NOT Verified: Redirect to DigilockerVerify
    if (!isVerified) {
      navigate('/verify/digilocker', { 
        state: { 
          nextPath: '/forgot-password', 
          message: "Identity Verified! Redirecting to Reset Password..." 
        } 
      });
      return;
    }

    // 2. If Verified: Perform Password Reset
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!newPassword || !verifiedPhone) {
      toast.error("Missing credentials. Please verify again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/password-reset/update', {
        phoneNumber: verifiedPhone,
        newPassword
      });

      if (res.data.success) {
        toast.success("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-lg ${isVerified ? 'bg-green-600' : 'bg-indigo-600'}`}>
          {isVerified ? <CheckCircle className="h-6 w-6 text-white" /> : <Key className="h-6 w-6 text-white" />}
        </div>
        <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
        <p className="mt-2 text-sm text-gray-600">
    {isVerified 
        ? "Identity Verified Successfully" 
        : "Enter your new password below, then verify your identity."}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl border border-gray-100 sm:px-10">
          
          <form onSubmit={handleAction} className="space-y-6">
            
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  // Responsive Fix: text-base prevents iOS zoom, sm:text-sm for desktop
                  className={`block w-full pl-10 text-base sm:text-sm border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 transition-all ${isVerified ? 'bg-white' : 'bg-gray-50'}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  // Responsive Fix: text-base prevents iOS zoom
                  className={`block w-full pl-10 text-base sm:text-sm border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 transition-all ${isVerified ? 'bg-white' : 'bg-gray-50'}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Dynamic Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-all transform hover:-translate-y-0.5
                ${isVerified 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }
              `}
            >
              {loading ? (
                'Processing...'
              ) : isVerified ? (
                'Reset Password'
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" /> Verify via DigiLocker
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-6">
             <Link
                to="/login"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;