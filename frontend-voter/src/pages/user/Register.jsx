import React, { useState } from 'react';
import {
  Shield,
  Lock,
  AlertCircle,
  CheckCircle,
  User,
  ExternalLink,
  ArrowLeft,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
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

  // UI-only states
  const [touched, setTouched] = useState({ username: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Username rules
  const usernameRules = [
    { label: 'At least 3 characters', isValid: v => v.length >= 3 },
    { label: 'Alphanumeric only', isValid: v => /^[a-zA-Z0-9]+$/.test(v) }
  ];

  // Password rules
  const passwordRules = [
    { label: 'At least 8 characters', isValid: v => v.length >= 8 },
    { label: 'One uppercase letter', isValid: v => /[A-Z]/.test(v) },
    { label: 'One lowercase letter', isValid: v => /[a-z]/.test(v) },
    { label: 'One number', isValid: v => /[0-9]/.test(v) },
    { label: 'One special character', isValid: v => /[^A-Za-z0-9]/.test(v) },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isVerified) {
      setError('Please verify your identity via Digilocker first.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!username || !password || !phoneNumber || !verificationData) {
      setError('Missing verification data. Please try again.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/register', {
        username,
        password,
        phoneNumber,
        digilockerData: verificationData
      });

      toast.success('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 px-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div
            className="mx-auto h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer"
            onClick={() => onViewChange?.('landing')}
          >
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the secure voting platform
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl">

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleRegister}>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setTouched(t => ({ ...t, username: true }));
                    }}
                    onBlur={() => setTouched(t => ({ ...t, username: true }))}
                    className="pl-10 p-3 w-full border rounded-lg"
                    placeholder="Enter username"
                  />
                </div>

                {touched.username && (
                  <div className="mt-2 space-y-1 text-xs">
                    {usernameRules.map((r, i) => (
                      <div key={i} className="flex items-center">
                        {r.isValid(username)
                          ? <Check className="h-3 w-3 text-green-500 mr-1" />
                          : <div className="h-2 w-2 bg-gray-300 rounded-full mr-2" />}
                        <span className={r.isValid(username) ? 'text-green-600' : 'text-gray-500'}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setTouched(t => ({ ...t, password: true }));
                    }}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    className="pl-10 pr-10 p-3 w-full border rounded-lg"
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {touched.password && (
                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                    {passwordRules.map((r, i) => (
                      <div key={i} className="flex items-center">
                        {r.isValid(password)
                          ? <Check className="h-3 w-3 text-green-500 mr-1" />
                          : <div className="h-2 w-2 bg-gray-300 rounded-full mr-2" />}
                        <span className={r.isValid(password) ? 'text-green-600' : 'text-gray-500'}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 p-3 w-full border rounded-lg ${
                      confirmPassword && confirmPassword !== password ? 'border-red-400' : ''
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <X className="h-3 w-3 mr-1" /> Passwords do not match
                  </p>
                )}
              </div>

              {/* DigiLocker */}
              {!isVerified ? (
                <Link
                  to="/verify/digilocker"
                  className="w-full flex items-center justify-center px-4 py-3 border border-blue-200 rounded-xl text-blue-700 bg-blue-50"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Verify via DigiLocker
                </Link>
              ) : (
                <div className="w-full flex items-center justify-center px-4 py-3 border border-green-200 rounded-xl text-green-700 bg-green-50">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Identity Verified
                </div>
              )}

              {/* Register */}
              <button
                type="submit"
                disabled={loading || !isVerified}
                className={`w-full py-3 rounded-xl text-white ${
                  loading || !isVerified
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-indigo-600 flex items-center justify-center w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
