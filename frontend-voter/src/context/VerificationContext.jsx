import React, { createContext, useState, useContext } from "react";

const VerificationContext = createContext();

export const VerificationProvider = ({ children }) => {
  const [username, setUsername] = useState("");         // stores current username
  const [isVerified, setIsVerified] = useState(false);  // stores Digilocker verification state
  const [verificationData, setVerificationData] = useState(null); // stores Digilocker data

  return (
    <VerificationContext.Provider
      value={{ username, setUsername, isVerified, setIsVerified, verificationData, setVerificationData }}
    >
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => useContext(VerificationContext);
