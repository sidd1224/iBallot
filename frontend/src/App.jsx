import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import the page components you have created
import Login from './pages/Login'; 
import RegisterStep1 from './pages/Register'; 


// The 'export default' has been removed from this line.
// We are now just defining a standard function.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Main Routes --- */}
        
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* --- Registration Flow Routes --- */}
        
        <Route path="/register" element={<RegisterStep1 />} />
        
        
        {/* A catch-all route for any page that doesn't exist */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

// This line at the end correctly exports the App function as the default.
export default App;

