// frontend/src/pages/user/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  // --- NEW: Get voting status from local storage ---
  const hasVoted = currentUser?.hasVoted;

  useEffect(() => {
    const fetchActiveElections = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/dashboard`, {
          params: { username: currentUser?.user?.username }
        });
        setElections(response.data.elections);
      } catch (err) {
        setError('Failed to fetch active elections. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch elections if the user has not voted
    if (currentUser?.user?.username && !hasVoted) {
        fetchActiveElections();
    } else {
        setLoading(false);
    }
  }, [currentUser?.user?.username, hasVoted]);

  const handleProceedToVote = (election) => {
    const constituencyData = currentUser.constituency;
    let constituencyId;

    if (election.type === 'STATE_LEGISLATIVE') {
        constituencyId = constituencyData.ac_id;
    } else if (election.type === 'PARLIAMENTARY') {
        constituencyId = constituencyData.pc_id;
    }

    if (!constituencyId) {
        alert("Could not determine your constituency ID for this election. Please log out and log back in.");
        return;
    }
    
    navigate(`/candidates/${election.election_id}/${constituencyId}`);
  };

  const renderElectionCard = (election) => (
    <div key={election.election_id} className="bg-white shadow-md rounded-lg p-6 border-l-4 border-indigo-500">
      <h3 className="text-xl font-bold text-gray-800">{election.name}</h3>
      <p className="text-sm text-gray-500 uppercase mt-1">
        Type: {election.type}
      </p>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Starts:</strong> {new Date(election.start_time).toLocaleString()}</p>
        <p><strong>Ends:</strong> {new Date(election.end_time).toLocaleString()}</p>
      </div>
      <div className="mt-6">
        <button 
          className="w-full btn bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          onClick={() => handleProceedToVote(election)}
        >
          View Candidates
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Voter Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {currentUser?.user?.username || 'Voter'}!
          </p>
        </header>

        <main>
          {/* --- NEW: Conditional rendering based on voting status --- */}
          {hasVoted ? (
            <div className="text-center py-10 px-6 bg-green-100 border-l-4 border-green-500 rounded-lg shadow-sm">
              <p className="text-lg font-semibold text-green-800">Thank you for voting!</p>
              <p className="text-gray-600 mt-2">Your vote has been securely recorded on the blockchain.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Eligible Elections</h2>
              
              {loading && <p>Loading elections...</p>}
              
              {error && <p className="text-red-500">{error}</p>}

              {!loading && !error && (
                <div className="space-y-6">
                  {elections.length > 0 ? (
                    elections.map(renderElectionCard)
                  ) : (
                    <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm">
                      <p className="text-gray-500">There are no active elections for your constituency at the moment.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;