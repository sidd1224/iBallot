import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Mock user (change role to "user" to test normal user view)
const user = {
  email: "user@app.com", // or "admin@app.com"
  role: "user", // "admin" or "user"
};

export default function Election() {
  const navigate = useNavigate();
  const electionActive = true; // set false to disable voting

  // Pre-filled candidates with votes
  const [candidates, setCandidates] = useState([
    { name: "Alice Johnson", votes: 0 },
    { name: "Bob Smith", votes: 0 },
    { name: "Carol Williams", votes: 0 },
    { name: "David Brown", votes: 0 },
  ]);

  const [hasVoted, setHasVoted] = useState(false); // track if user voted
  const [candidateName, setCandidateName] = useState("");

  // Admin adds candidate
  const handleAddCandidate = () => {
    if (candidateName.trim() === "") return;
    setCandidates([...candidates, { name: candidateName, votes: 0 }]);
    setCandidateName("");
  };

  // Normal user votes
  const handleVote = (index) => {
    if (!electionActive) {
      alert("Election is not active right now.");
      return;
    }

    if (hasVoted) {
      alert("You have already voted.");
      return;
    }

    const updatedCandidates = [...candidates];
    updatedCandidates[index].votes += 1;
    setCandidates(updatedCandidates);
    setHasVoted(true);

    // Redirect to ThankYou page
    navigate("/thankyou");
  };

  // Scroll to admin panel
  const goToAdminPanel = () => {
    const adminSection = document.getElementById("admin-section");
    if (adminSection) adminSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6 flex flex-col items-center">
      {/* Top Nav */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 px-4">
        <h1 className="text-3xl font-bold text-gray-800">Election Page</h1>
        {user.role === "admin" && (
          <button
            onClick={goToAdminPanel}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            Admin Panel
          </button>
        )}
      </div>

      {/* Candidate Cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 gap-4 mb-10">
        {candidates.map((candidate, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {candidate.name}
              </h2>
              <p className="text-gray-600">{candidate.votes} votes</p>
            </div>
            {user.role !== "admin" && (
              <button
                onClick={() => handleVote(index)}
                disabled={!electionActive || hasVoted}
                className={`px-4 py-2 rounded font-semibold transition ${
                  !electionActive || hasVoted
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {!electionActive
                  ? "Voting Closed"
                  : hasVoted
                  ? "Voted"
                  : "Vote"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Admin Panel */}
      {user.role === "admin" && (
        <div
          id="admin-section"
          className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Admin Panel: Add Candidates
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Candidate Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddCandidate}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
            >
              Add Candidate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



