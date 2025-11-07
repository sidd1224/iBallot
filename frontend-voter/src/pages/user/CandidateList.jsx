import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const CandidateList = () => {
  const { electionId, assemblyId } = useParams();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [password, setPassword] = useState("");
  const [voteError, setVoteError] = useState("");

  // ✅ Always use sessionStorage (not localStorage)
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");
  const constituencyData = JSON.parse(sessionStorage.getItem("constituency"));

  // 🧠 Redirect back to login if session expired
  useEffect(() => {
    if (!user || !token) {
      console.warn("⚠️ Session expired or missing user/token — redirecting to login");
      navigate("/login");
    }
  }, [user, token, navigate]);

  // ✅ Fetch candidates from backend
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        if (!token || !user?.username) {
          setError("Missing token or user info. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/candidates/${electionId}/${assemblyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ Candidates fetched:", response.data);
        setCandidates(response.data.candidates || []);
      } catch (err) {
        console.error("❌ Error fetching candidates:", err);
        if (err.response?.status === 401) {
          // Token expired or unauthorized → force re-login
          sessionStorage.clear();
          navigate("/login");
        }
        setError("Failed to fetch candidates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [electionId, assemblyId, token, user, navigate]);

  // ✅ Handle vote submission
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

    setVoteError("");
    setIsVoting(true);

    try {
      const response = await axios.post(
        `/api/vote`,
        {
          username: user?.username,
          password,
          electionId: parseInt(electionId),
          candidateId: selectedCandidate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`✅ Vote cast successfully!\nTransaction Hash: ${response.data.txHash}`);
      sessionStorage.clear(); // Optional — force logout after voting
      navigate("/login");
    } catch (err) {
      console.error("❌ Vote error:", err);
      if (err.response?.status === 401) {
        sessionStorage.clear();
        navigate("/login");
      }
      setVoteError(err.response?.data?.error || "An unexpected error occurred while voting.");
    } finally {
      setIsVoting(false);
    }
  };

  // ✅ Conditional Rendering
  if (loading)
    return <div className="p-8 text-center text-lg">Loading Candidates...</div>;
  if (error)
    return <div className="p-8 text-center text-red-600">{error}</div>;

  // ✅ Main UI
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cast Your Vote</h1>
          <p className="text-gray-500 mt-2">
            Select one candidate for Election #{electionId}
          </p>
        </header>

        {/* --- Candidate Cards --- */}
        <div className="space-y-4">
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate.id)}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCandidate === candidate.id
                    ? "border-indigo-600 bg-indigo-50 shadow-md scale-105"
                    : "border-gray-200 hover:border-indigo-400"
                }`}
              >
                {/* Symbol */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                  {candidate.symbol && (
                    <img
                      src={
                        candidate.symbol.startsWith("http")
                          ? candidate.symbol
                          : `/api${candidate.symbol}`
                      }
                      alt={`${candidate.party_name} symbol`}
                      className="w-full h-full object-contain p-1"
                    />
                  )}
                </div>

                {/* Candidate Info */}
                <div className="flex-grow">
                  <span className="font-semibold text-xl text-gray-800">
                    {candidate.name}
                  </span>
                  <div className="text-md text-gray-600">
                    {candidate.party_name}
                  </div>
                </div>

                {/* Selection Indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ml-4 ${
                    selectedCandidate === candidate.id
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedCandidate === candidate.id && (
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No candidates found for this election.
            </p>
          )}
        </div>

        {/* --- Voting Form --- */}
        <form onSubmit={handleVoteSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm with Password
            </label>
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
          {voteError && (
            <p className="text-red-500 text-sm text-center -my-2">{voteError}</p>
          )}
          <button
            type="submit"
            disabled={
              selectedCandidate === null || isVoting || candidates.length === 0
            }
            className="w-full btn bg-green-600 text-white py-3 text-base font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVoting ? "Submitting..." : "Submit Final Vote"}
          </button>
        </form>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full text-center text-indigo-600 hover:underline mt-4"
        >
          Cancel and Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CandidateList;
