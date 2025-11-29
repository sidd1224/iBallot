import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`/admin/auth/login`, { token });
      sessionStorage.setItem('adminToken', token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid admin credentials provided.');
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto bg-indigo-600 h-12 w-12 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">iBallot Admin</h1>
        <p className="text-gray-500 mt-2">Secure Election Management System</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            Authenticate Access
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="admin-token" className="block text-sm font-medium text-gray-700 mb-2">
                Security Token
              </label>
              <div className="relative">
                <input
                  id="admin-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your secure admin token"
                  className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Restricted access. All activities are monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;