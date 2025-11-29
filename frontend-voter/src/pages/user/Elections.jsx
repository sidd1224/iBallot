import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  Vote,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  LogOut,
  Bell,
  User,
  BarChart3
} from "lucide-react";

const Elections = () => {
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");
  
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidateList, setCandidateList] = useState([]);
  const [voteStats, setVoteStats] = useState(null);
  const [assemblyWinners, setAssemblyWinners] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        if (!token) {
          setLoading(false);
          return navigate("/login");
        }
        const res = await axios.get("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.elections) setElections(res.data.elections);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching elections:", err);
        setLoading(false);
      }
    };
    fetchElections();
  }, [token, navigate]);

  const handleViewDetails = async (election) => {
    setSelectedElection(election);
    setDetailsLoading(true);
    setCandidateList([]);
    setVoteStats(null);
    setAssemblyWinners([]);

    try {
      const res = await axios.get(`/api/election-stats/${election.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCandidateList(res.data.candidates);
        setVoteStats({
          totalVotes: res.data.election.totalVotes,
          winner: res.data.winner
        });
        // ✅ Set the AC-wise breakdown data
        setAssemblyWinners(res.data.assemblyWinners || []);
      }
    } catch (err) {
      console.error("Failed to fetch details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedElection(null);
    setCandidateList([]);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">
            {selectedElection ? "Election Breakdown" : "Active Elections"}
        </h2>
        {selectedElection && (
            <button onClick={handleBack} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                ← Back to List
            </button>
        )}
      </div>

      {!selectedElection && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.length > 0 ? (
                elections.map((election) => (
                    <div key={election.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg"><Vote className="h-6 w-6 text-indigo-600" /></div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    election.status === 'Live' ? 'bg-red-100 text-red-600' : 
                                    election.status === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                                }`}>{election.status}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{election.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{election.description}</p>
                        </div>
                        <button onClick={() => handleViewDetails(election)} className="w-full mt-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            View Full Breakdown
                        </button>
                    </div>
                ))
            ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">No active elections found.</div>
            )}
        </div>
      )}

      {selectedElection && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-lg">
                    <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide mb-1">Total Votes</p>
                    <h3 className="text-4xl font-bold">{detailsLoading ? "..." : voteStats?.totalVotes || "0"}</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Leading Candidate</p>
                    <h3 className="text-2xl font-bold text-gray-900">{detailsLoading ? "..." : voteStats?.winner?.name || "No Votes"}</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Constituencies Reporting</p>
                     <h3 className="text-2xl font-bold text-gray-900">{detailsLoading ? "..." : assemblyWinners.length}</h3>
                </div>
            </div>

            {/* AC-Wise Breakdown Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">Constituency-wise Winners</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-3">AC ID</th>
                                <th className="px-6 py-3">Winner</th>
                                <th className="px-6 py-3">Party</th>
                                <th className="px-6 py-3 text-right">Votes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {detailsLoading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center">Loading constituency data...</td></tr>
                            ) : assemblyWinners.length > 0 ? (
                                assemblyWinners.map((w) => (
                                    <tr key={w.ac_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">AC-{w.ac_id}</td>
                                        <td className="px-6 py-4">{w.winnerName}</td>
                                        <td className="px-6 py-4 text-gray-500">{w.party}</td>
                                        <td className="px-6 py-4 text-right font-bold text-indigo-600">{w.votes}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No breakdown data available.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* All Candidates List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">All Candidates</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {candidateList.map((candidate) => (
                        <div key={candidate.candidate_id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border text-gray-500 font-bold">
                                    {candidate.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{candidate.name}</h4>
                                    <p className="text-xs text-gray-500">AC-{candidate.constituency_id} • {candidate.party}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-indigo-600">{candidate.votes}</p>
                                <p className="text-[10px] text-gray-400 uppercase">Votes</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Elections;