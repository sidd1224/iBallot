import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import the page components you have created
import Login from './pages/Login'; 
// --- PATHS CORRECTED HERE ---
// The import path now points to the 'pages' directory.
import RegisterStep1 from './pages/register_1'; 
import RegisterStep2 from './pages/register_2'; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Main Routes --- */}
        
        {/* Redirect the root URL "/" to the login page */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Route for the login page */}
        <Route path="/login" element={<Login />} />

        {/* --- Registration Flow Routes --- */}
        
        {/* This path has been updated to match the URL from your screenshot */}
        <Route path="/register/step1" element={<RegisterStep1 />} />

        {/* This will now correctly find and display your RegisterStep2 component */}
        <Route path="/register/step2" element={<RegisterStep2 />} />

        {/* --- Add other application routes here, e.g., dashboard --- */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}

        {/* A catch-all route for any page that doesn't exist */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

