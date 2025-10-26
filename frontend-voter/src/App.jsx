import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { VerificationProvider } from './context/VerificationContext';

// Lazy load user pages
const Login = React.lazy(() => import('./pages/user/Login'));
const Register = React.lazy(() => import('./pages/user/Register'));
const Dashboard = React.lazy(() => import('./pages/user/Dashboard'));
const DigilockerVerify = React.lazy(() => import('./pages/user/DigilockerVerify'));
const CandidateList = React.lazy(() => import('./pages/user/CandidateList'));

// --- ADMIN IMPORTS ARE REMOVED ---

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-100">
    <div className="text-xl font-semibold">Loading...</div>
  </div>
);

function App() {
  return (
    <VerificationProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* --- VOTER ROUTES --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verify/digilocker" element={<DigilockerVerify />} />
            <Route path="/candidates" element={<CandidateList />} />

            {/* Default route redirects to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* All other routes (including any potential admin paths mistakenly typed) redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </VerificationProvider>
  );
}

export default App;

