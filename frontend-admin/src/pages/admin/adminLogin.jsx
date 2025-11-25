import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // The backend route for admin authentication
      await axios.post(`/admin/auth/login`, { token });
      
      // On success, store the token and navigate to the dashboard
      sessionStorage.setItem('adminToken', token);
      navigate('/admin/dashboard');

    } catch (err) {
      setError('Invalid admin token. Please try again.');
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">iBallot Admin Panel</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="admin-token" className="block text-sm font-medium text-gray-700">Admin Token</label>
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your secret admin token"
              className="mt-1 w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs text-center mt-4">{error}</p>}
          <button 
            type="submit" 
            disabled={loading} 
            className="mt-6 w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

