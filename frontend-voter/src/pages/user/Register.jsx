import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle, User, ExternalLink, ArrowLeft, Check, X } from 'lucide-react';
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
  
  // Track if fields have been touched to avoid showing errors before typing
  const [touched, setTouched] = useState({ username: false, password: false });

  const navigate = useNavigate();

  // --- VALIDATION RULES ---
  const usernameRules = [
    { 
      label: "At least 3 characters", 
      isValid: (val) => val.length >= 3 
    },
    { 
      label: "Alphanumeric only (Letters & Numbers)", 
      isValid: (val) => /^[a-zA-Z0-9]+$/.test(val) 
    }
  ];

  const passwordRules = [
    { label: "At least 8 characters", isValid: (val) => val.length >= 8 },
    { label: "One Uppercase Letter (A-Z)", isValid: (val) => /[A-Z]/.test(val) },
    { label: "One Lowercase Letter (a-z)", isValid: (val) => /[a-z]/.test(val) },
    { label: "One Number (0-9)", isValid: (val) => /[0-9]/.test(val) },
    { label: "One Special Character (!@#$)", isValid: (val) => /[^A-Za-z0-9]/.test(val) },
  ];

  // Helper to check if all rules pass
  const isUsernameValid = usernameRules.every(rule => rule.isValid(username));
  const isPasswordValid = passwordRules.every(rule => rule.isValid(password));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isVerified) {
      setError('Please verify your identity via Digilocker first.');
      return;
    }
    
    // Strict Validation Check on Submit
    if (!isUsernameValid) {
      setError("Please fix username errors.");
      return;
    }
    if (!isPasswordValid) {
      setError("Please fix password errors.");
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
      
      console.log("Registration Success:", response.data);
      toast.success("Registration successful! Redirecting to login...");
      
      setTimeout(() => {
        if (onViewChange) onViewChange('login');
        else navigate('/login');
      }, 2000);

    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.response?.data?.error || "Registration failed. Please try again.");
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Create Secure Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Verified & protected by <span className="font-semibold text-indigo-600">iBallot Blockchain</span>
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
            {/* Identity Verification Badge */}
            <div className={`mb-6 p-4 rounded-xl border ${isVerified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center">
                {isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-3" />
                )}
                <div>
                  <h3 className={`text-sm font-medium ${isVerified ? 'text-green-800' : 'text-amber-800'}`}>
                    {isVerified ? 'Identity Verified Successfully' : 'Identity Verification Pending'}
                  </h3>
                  <div className={`text-xs mt-1 ${isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                    {isVerified 
                      ? `Verified via Digilocker (${verificationData?.name || 'User'})`
                      : 'Please verify your Aadhaar to continue registration.'}
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200 animate-pulse">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Registration Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setTouched(prev => ({ ...prev, username: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                    placeholder="Choose a username"
                  />
                </div>
                
                {/* Username Validation Checklist */}
                {touched.username && (
                  <div className="mt-2 space-y-1">
                    {usernameRules.map((rule, index) => {
                      const met = rule.isValid(username);
                      return (
                        <div key={index} className="flex items-center text-xs">
                          {met ? (
                            <Check className="h-3 w-3 text-green-500 mr-1.5" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mr-2 ml-1" />
                          )}
                          <span className={met ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setTouched(prev => ({ ...prev, password: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                    placeholder="Create a strong password"
                  />
                </div>

                {/* Password Validation Checklist */}
                {touched.password && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {passwordRules.map((rule, index) => {
                      const met = rule.isValid(password);
                      return (
                        <div key={index} className="flex items-center text-xs">
                          {met ? (
                            <Check className="h-3 w-3 text-green-500 mr-1.5" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mr-2 ml-1" />
                          )}
                          <span className={met ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all ${
                      confirmPassword && confirmPassword !== password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <X className="h-3 w-3 mr-1" /> Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isVerified || !isUsernameValid || !isPasswordValid}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-all ${
                  loading || !isVerified || !isUsernameValid || !isPasswordValid
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