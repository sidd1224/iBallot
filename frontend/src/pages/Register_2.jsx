import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * RegisterStep2 Component
 * The final step of voter registration. It displays constituency options
 * returned from the first step and allows the user to submit their final
 * registration details.
 */
function RegisterStep2() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve the data passed from the first step via location state.
  const { userData, constituencyData } = location.state || {};

  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [selectedParliament, setSelectedParliament] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // If a user navigates directly to this page, the state will be empty.
    // Redirect them back to the first step to start over.
    if (!userData || !constituencyData) {
      navigate('/register/step1');
      return;
    }
    // Pre-select the first available constituency as a default.
    if (constituencyData.assemblies?.length > 0) {
      setSelectedAssembly(constituencyData.assemblies[0].id);
    }
    if (constituencyData.parliaments?.length > 0) {
      setSelectedParliament(constituencyData.parliaments[0].id);
    }
  }, [userData, constituencyData, navigate]);

  /**
   * Handles the final submission to the `/register/complete` endpoint.
   * @param {React.FormEvent<HTMLFormElement>} e - The form event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedAssembly || !selectedParliament) {
      setError('Please select both your Assembly and Parliament constituencies.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register/complete', {
        username: userData.username,
        password: userData.password,
        aadhaarFilename: userData.aadhaarFilename,
        assemblyId: parseInt(selectedAssembly, 10),
        parliamentId: parseInt(selectedParliament, 10),
      });

      setSuccess(`${response.data.message}. Your Voter Hash is: ${response.data.voterHash}`);

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to complete registration.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render a loading state or nothing until the redirect effect has run.
  if (!constituencyData) return null;

  return (
    <div className="container">
      <h2>Confirm Your Details - Step 2 of 2</h2>
      <div className="details-box">
        <p><strong>State:</strong> {constituencyData.state_name}</p>
        <p><strong>District:</strong> {constituencyData.district_name}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="assembly">Select Assembly Constituency:</label>
          <select id="assembly" value={selectedAssembly} onChange={(e) => setSelectedAssembly(e.target.value)} required>
            {constituencyData.assemblies.map((ac) => (
              <option key={ac.id} value={ac.id}>
                {ac.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="parliament">Select Parliament Constituency:</label>
          <select id="parliament" value={selectedParliament} onChange={(e) => setSelectedParliament(e.target.value)} required>
            {constituencyData.parliaments.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading || success}>
          {loading ? 'Finalizing...' : 'Complete Registration'}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
}

export default RegisterStep2;

