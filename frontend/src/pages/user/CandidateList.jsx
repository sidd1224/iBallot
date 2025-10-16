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

  // State for the voting process
  const [isVoting, setIsVoting] = useState(false);
  const [password, setPassword] = useState('');
  const [voteError, setVoteError] = useState('');

  // Get username from session for the API call
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/candidates/${electionId}/${assemblyId}`);
        setCandidates(response.data.candidates);
      } catch (err) {
        setError('Failed to fetch the list of candidates.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [electionId, assemblyId, apiUrl]);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedCandidate === null) {
      setVoteError("Please select a candidate before submitting.");
      return;
    }
    if (!password) {
      setVoteError("Please enter your password to confirm your vote.");
      return;
    }

    setVoteError('');
    setIsVoting(true);

    try {
      const response = await axios.post(`${apiUrl}/vote`, {
        username: currentUser?.user?.username,
        password: password,
        electionId: parseInt(electionId),
        candidateId: selectedCandidate,
      });

      alert(`Vote cast successfully!\nTransaction Hash: ${response.data.txHash}`);
      navigate('/login');

    } catch (err) {
      setVoteError(err.response?.data?.error || 'An unexpected error occurred while casting your vote.');
      console.error(err);
    } finally {
      setIsVoting(false);
    }
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
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCandidate === candidate.id
                    ? 'border-indigo-600 bg-indigo-50 shadow-md scale-105'
                    : 'border-gray-200 hover:border-indigo-400'
                }`}
              >
                {/* --- UPDATED: Symbol Image Container --- */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                  {candidate.symbol && (
                    <img
                      src={`${apiUrl}${candidate.symbol}`}
                      alt={`${candidate.party_name} symbol`}
                      className="w-full h-full object-contain p-1"
                    />
                  )}
                </div>

                {/* --- UPDATED: Text Info Container --- */}
                <div className="flex-grow">
                  <span className="font-semibold text-xl text-gray-800">{candidate.name}</span>
                  <div className="text-md text-gray-600">
                    {candidate.party_name}
                  </div>
                </div>

                {/* --- UPDATED: Selection Indicator --- */}
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ml-4 ${
                    selectedCandidate === candidate.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                }`}>
                  {selectedCandidate === candidate.id && <div className="w-3 h-3 rounded-full bg-white"></div>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No candidates found for this election.</p>
          )}
        </div>
        
        <form onSubmit={handleVoteSubmit} className="mt-8 flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm with Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to confirm vote"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                    disabled={selectedCandidate === null}
                />
            </div>
            {voteError && <p className="text-red-500 text-sm text-center -my-2">{voteError}</p>}
            <button
                type="submit"
                disabled={selectedCandidate === null || isVoting || candidates.length === 0}
                className="w-full btn bg-green-600 text-white py-3 text-base font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isVoting ? 'Submitting...' : 'Submit Final Vote'}
            </button>
        </form>
        <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-center text-indigo-600 hover:underline mt-4"
        >
            Cancel and Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CandidateList;