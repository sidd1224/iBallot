import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [electionActive] = useState(true); // change to false if election not active

  const handleStartVoting = () => {
    if (electionActive) {
      navigate("/election");
    } else {
      alert("No active election right now.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {electionActive ? (
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          onClick={handleStartVoting}
        >
          Start Voting
        </button>
      ) : (
        <p className="text-gray-600">No active election</p>
      )}
    </div>
  );
}


