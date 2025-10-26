import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import the page components
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import DigilockerVerify from './pages/user/DigilockerVerify';
import { VerificationProvider } from './context/VerificationContext.jsx'; // <-- import context
import Dashboard from './pages/user/Dashboard';
import CandidateList from './pages/user/CandidateList';
import AdminDashboard from './pages/admin/adminDashboard';
import AdminLogin from './pages/admin/adminLogin';

function App() {
  return (
    <VerificationProvider> {/* <-- Wrap your app with provider */}
      <BrowserRouter>
        <Routes>
          {/* --- Main Routes --- */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/admin" element={<Navigate to="/admin/login" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* --- Voting Flow --- */}
          {/* 2. Add the new route with its parameters */}
          <Route path="/candidates/:electionId/:assemblyId" element={<CandidateList />} />

          {/* --- Registration Flow Routes --- */}
          <Route path="/register" element={<Register />} />
          <Route path="/digilocker/verify" element={<DigilockerVerify />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </VerificationProvider>
  );
}

export default App;
