import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Vote } from "lucide-react"; 

const Elections = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidateList, setCandidateList] = useState([]);
  const [voteStats, setVoteStats] = useState(null);
  const [assemblyWinners, setAssemblyWinners] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const ws = useRef(null);

  // 1. Fetch Elections List
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

  // 2. Fetch Details when an Election is clicked
  const handleElectionClick = async (election) => {
    setSelectedElection(election);
    setDetailsLoading(true);
    setCandidateList([]);
    setVoteStats(null);
    setAssemblyWinners([]);

    try {
      // Parallel fetch for stats and candidates
      const [statsRes, candidatesRes] = await Promise.all([
        axios.get(`/api/dashboard/stats/${election.election_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/candidate-list/${election.election_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (statsRes.data) {
        setVoteStats(statsRes.data.stats);
        setAssemblyWinners(statsRes.data.assemblyWinners || []);
      }
      
      if (candidatesRes.data.candidates) {
        // Sort candidates by votes initially
        setCandidateList(candidatesRes.data.candidates.sort((a, b) => b.votes - a.votes));
      }

    } catch (err) {
      console.error("Error fetching election details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // 3. WebSocket Connection for Live Updates
  useEffect(() => {
    if (!selectedElection) return;

    let wsUrl;
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const backendUrl = new URL(apiUrl || window.location.origin);
      
      let wsHost;
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      if (backendUrl.hostname === "backend") {
          // Case: Running in Docker Compose (VITE_API_URL=http://backend:5000)
          if (isLocalDev) {
              // Developer is on localhost, map internal 'backend' to localhost:5000
              wsHost = "localhost:5000";
          } else {
              // Production/Cloud Run auto-correction
              const currentHost = window.location.hostname;
              
              if (currentHost.includes('frontend-voter')) {
                  wsHost = currentHost.replace('frontend-voter', 'backend');
              } else if (currentHost.includes('frontend-admin')) {
                  wsHost = currentHost.replace('frontend-admin', 'backend');
              } else if (currentHost.includes('frontend')) {
                  wsHost = currentHost.replace('frontend', 'backend');
              } else {
                 // Fallback
                 wsHost = window.location.host;
              }
              console.warn(`Detected internal 'backend' config in production. Auto-corrected WS Host to: ${wsHost}`);
          }
      } else {
          // Production URL correctly set
          wsHost = backendUrl.host;
      }

      // Determine Protocol (WSS for HTTPS)
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${wsProtocol}//${wsHost}/ws`;
      
    } catch (err) {
      console.error("Failed to construct WebSocket URL", err);
      wsUrl = `ws://${window.location.host}/ws`;
    }

    let reconnectTimer;
    let isMounted = true; 

    const connect = () => {
      console.log("Attempting WebSocket connection to:", wsUrl);
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMounted) {
            socket.close();
            return;
        }
        console.log("✅ WebSocket connected:", wsUrl);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return; 
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "VOTE_UPDATE") {
            const { electionId, candidateId } = message.payload || message;
            
            // Only update if the update belongs to the currently selected election
            if (Number(electionId) === Number(selectedElection.election_id)) {
                
                // Update Vote Stats (Total Votes)
                setVoteStats(prev => prev ? {
                    ...prev,
                    votesCast: prev.votesCast + 1
                } : prev);

                // Update Candidate List
                setCandidateList(prev => {
                    const newList = prev.map(c => 
                        Number(c.candidate_id) === Number(candidateId)
                        ? { ...c, votes: Number(c.votes) + 1 }
                        : c
                    );
                    // Re-sort by votes descending to keep leaderboard live
                    return newList.sort((a, b) => b.votes - a.votes);
                });
            }
          }
        } catch (err) {
          console.error("WS Error:", err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.log("WebSocket disconnected, retrying...");
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.current = socket;
    };

    connect();

    return () => {
      isMounted = false;
      ws.current?.close();
      clearTimeout(reconnectTimer);
    };
  }, [selectedElection]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Election Dashboard</h1>
        <p className="opacity-90">View live results and ongoing elections</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Election List */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Vote className="h-5 w-5 text-indigo-600" />
                    Available Elections
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {elections.map((election) => (
                        <button
                            key={election.election_id}
                            onClick={() => handleElectionClick(election)}
                            className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-all ${
                                selectedElection?.election_id === election.election_id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""
                            }`}
                        >
                            <h3 className="font-semibold text-gray-900">{election.name}</h3>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>ID: {election.election_id}</span>
                                <span className={`px-2 py-0.5 rounded-full ${
                                    new Date(election.end_time) < new Date() ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                }`}>
                                    {new Date(election.end_time) < new Date() ? "Ended" : "Live"}
                                </span>
                            </div>
                        </button>
                    ))}
                    {elections.length === 0 && <div className="p-6 text-center text-gray-400">No elections found.</div>}
                </div>
            </div>

            {/* Right Column: Details & Stats */}
            <div className="lg:col-span-2">
                {!selectedElection ? (
                    <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4"><Vote className="h-8 w-8 text-gray-400" /></div>
                        <h3 className="text-lg font-medium text-gray-900">Select an Election</h3>
                        <p className="text-gray-500">Click on an election from the list to view live stats.</p>
                    </div>
                ) : detailsLoading ? (
                    <div className="flex justify-center py-12 bg-white rounded-2xl shadow-sm">
                        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 uppercase">Total Candidates</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{candidateList.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 uppercase">Votes Cast</p>
                                <p className="text-3xl font-bold text-indigo-600 mt-1">
                                    {voteStats?.votesCast?.toLocaleString() || 0}
                                </p>
                            </div>
                        </div>

                        {/* Candidates Leaderboard */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-gray-800">Candidate Leaderboard (Live)</h3>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                {candidateList.map((candidate, idx) => (
                                    <div key={candidate.candidate_id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="font-bold text-gray-300 w-6 text-center">{idx + 1}</div>
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                                                {candidate.symbol_image ? (
                                                    <img 
                                                      src={`/symbols/${candidate.symbol_image}`} 
                                                      alt="Symbol" 
                                                      className="h-full w-full object-cover"
                                                      onError={(e) => {e.target.style.display='none'}}
                                                    />
                                                ) : (
                                                    <span className="text-gray-500 font-bold">{candidate.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{candidate.name}</h4>
                                                <p className="text-xs text-gray-500 truncate">AC-{candidate.constituency_id} • {candidate.party}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="text-lg font-bold text-indigo-600">{candidate.votes}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">Votes</p>
                                        </div>
                                    </div>
                                ))}
                                {candidateList.length === 0 && <div className="p-8 text-center text-gray-500">No candidate data available.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Elections;