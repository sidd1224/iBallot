import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { VerificationProvider } from './context/VerificationContext';
import ForgotPassword from './pages/user/ForgotPassword';

// Lazy load user pages
const Login = React.lazy(() => import('./pages/user/Login'));
const Register = React.lazy(() => import('./pages/user/Register'));
const Dashboard = React.lazy(() => import('./pages/user/Dashboard'));
const DigilockerVerify = React.lazy(() => import('./pages/user/DigilockerVerify'));
const CandidateList = React.lazy(() => import('./pages/user/CandidateList'));
const LandingPage = React.lazy(() => import('./pages/user/LandingPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f3f4f6'
  }}>
    <div style={{ fontSize: '1.25rem', color: '#4b5563' }}>Loading...</div>
  </div>
);

function App() {
  return (
    <VerificationProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* --- USER ROUTES --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verify/digilocker" element={<DigilockerVerify />} />
            <Route path="/LandingPage" element={<LandingPage />} />
            {/* ✅ FIXED: Dynamic params for CandidateList */}
            <Route path="/candidates/:electionId/:assemblyId" element={<CandidateList />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Default redirect to login */}
            <Route path="*" element={<Navigate to="/LandingPage" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </VerificationProvider>
  );
}

export default App;
