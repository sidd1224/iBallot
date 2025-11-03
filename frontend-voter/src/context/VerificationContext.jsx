import React, { createContext, useContext, useState } from 'react';

const VerificationContext = createContext();

export const useVerification = () => useContext(VerificationContext);

export const VerificationProvider = ({ children }) => {
  // --- STATE TO SHARE ACROSS PAGES ---
  const [username, setUsername] = useState(''); // This is the Aadhaar number
  const [password, setPassword] = useState(''); // The user's new password
  const [phoneNumber, setPhoneNumber] = useState(''); // The phone number
  
  // This will hold the full data from Digilocker (uid, dob, etc.)
  const [verificationData, setVerificationData] = useState(null); 
  
  // This is the "green tick" status
  const [isVerified, setIsVerified] = useState(false); 
  // --- END STATE ---

  const value = {
    username, setUsername,
    password, setPassword,
    phoneNumber, setPhoneNumber,
    verificationData, setVerificationData,
    isVerified, setIsVerified
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

