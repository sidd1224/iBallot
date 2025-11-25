import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Import the page components
import { VerificationProvider } from './context/VerificationContext.jsx'; // <-- import context
import AdminDashboard from './pages/admin/adminDashboard';
import AdminLogin from './pages/admin/adminLogin';

function App() {
  return (
    <VerificationProvider> {/* <-- Wrap your app with provider */}
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Navigate to="/admin/login" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          
          {/* Catch-all route */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </VerificationProvider>
  );
}

export default App;
