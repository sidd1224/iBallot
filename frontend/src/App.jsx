import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import the page components
import Login from './pages/Login';
import Register from './pages/Register';
import DigilockerVerify from './pages/DigilockerVerify';

// Placeholder for the Dashboard component as it's not provided
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p>You are logged in.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Main Routes --- */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* --- Registration Flow Routes --- */}
        <Route path="/register" element={<Register />} />
        <Route path="/digilocker/verify" element={<DigilockerVerify />} />
        
        {/* A catch-all route for any page that doesn't exist */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;