import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CandidateList = () => {
  const { electionId, assemblyId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/candidates/${electionId}/${assemblyId}`);
        setCandidates(response.data.candidates);
      } catch (err) {
        setError('Failed to fetch the list of candidates.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [electionId, assemblyId]); // Re-fetch if these params change

  const handleVote = () => {
    if (selectedCandidate === null) {
      alert("Please select a candidate before submitting your vote.");
      return;
    }
    const candidateName = candidates.find(c => c.id === selectedCandidate)?.name;
    alert(`This will cast your vote for ${candidateName} (ID: ${selectedCandidate})`);
    
    // In a real implementation, you would call the POST /vote endpoint here
    // and then navigate to a confirmation page.
    // e.g., navigate('/vote/success');
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading Candidates...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cast Your Vote</h1>
          <p className="text-gray-500 mt-2">Select one candidate for Election #{electionId}</p>
        </header>

        <div className="space-y-4">
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate.id)}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCandidate === candidate.id
                    ? 'border-indigo-600 bg-indigo-50 shadow-md scale-105'
                    : 'border-gray-200 hover:border-indigo-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center ${
                    selectedCandidate === candidate.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                }`}>
                  {selectedCandidate === candidate.id && <div className="w-3 h-3 rounded-full bg-white"></div>}
                </div>
                <span className="font-semibold text-lg text-gray-800">{candidate.name}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No candidates found for this election.</p>
          )}
        </div>
        
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={handleVote}
            disabled={selectedCandidate === null || candidates.length === 0}
            className="w-full btn bg-green-600 text-white py-3 text-base font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Submit Final Vote
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-center text-indigo-600 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateList;