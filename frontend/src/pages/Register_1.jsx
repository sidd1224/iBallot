import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * RegisterStep1 Component
 * The first step of the voter registration process.
 * It collects username, password, and the Aadhaar XML file, then sends them
 * to the backend for validation.
 */
function RegisterStep1() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  /**
   * Handles the file input change event.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The event object.
   */
  const handleFileChange = (e) => {
    // We only care about the first file if multiple are selected.
    if (e.target.files) {
      setAadhaarFile(e.target.files[0]);
    }
  };

  /**
   * Handles the form submission. It creates a FormData object to send the
   * file and user credentials to the `/register/start` endpoint.
   * @param {React.FormEvent<HTMLFormElement>} e - The form event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aadhaarFile) {
        setError("Please select your Aadhaar XML file.");
        return;
    }
    setLoading(true);
    setError('');

    // Use FormData to send multipart/form-data, which is required for file uploads.
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    // The key 'aadhaarFile' must match the one used in the multer middleware on the backend.
    formData.append('aadhaarFile', aadhaarFile);

    try {
      // The browser will automatically set the correct 'Content-Type' header for FormData.
      const response = await axios.post('http://localhost:5000/register/start', formData);

      // On success, navigate to the second step, passing all necessary data in the state.
      navigate('/register/step2', {
        state: {
          // Pass the original credentials and the secure filename from the backend.
          userData: { 
            username, 
            password, 
            aadhaarFilename: response.data.aadhaarFilename 
          },
          // Pass the constituency data for the user to make a selection.
          constituencyData: response.data,
        },
      });

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Voter Registration - Step 1 of 2</h2>
      <p>Enter your details and upload your Aadhaar XML file to begin.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="aadhaarFile">Aadhaar XML File:</label>
          <input
            id="aadhaarFile"
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Next: Select Constituency'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}
-
export default RegisterStep1;

