import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
  Shield,
  LayoutDashboard,
  Vote,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Loader2,
  Plus,
  Upload,
  Activity,
  ArrowRight
} from 'lucide-react';

// --- UI Helper Components ---
const StatCard = ({ title, value, icon, color = "indigo" }) => {
    const colorClasses = {
        indigo: "text-indigo-600 bg-indigo-50",
        green: "text-green-600 bg-green-50",
        blue: "text-blue-600 bg-blue-50",
        orange: "text-orange-600 bg-orange-50"
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
            <div className={`mr-4 p-3 rounded-xl ${colorClasses[color] || colorClasses.indigo}`}>
                {typeof icon === 'string' ? <span className="text-2xl">{icon}</span> : icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};

// --- Page-Specific Components ---

// ✅ UPDATED: HomePage now accepts 'setCurrentPage' to handle navigation
const HomePage = ({ adminToken, isActive, setCurrentPage }) => {
    const [stats, setStats] = useState({ totalVoters: 0, activeElections: 0, totalCandidates: 0 });
    const [liveElection, setLiveElection] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Summary Stats
                const statsRes = await axios.get(`/admin/dashboard/summary`, {
                    headers: { Authorization: adminToken }
                });
                if (statsRes.data.success) {
                    setStats(statsRes.data.stats);
                }

                // 2. Fetch Elections to find if one is LIVE
                const electionsRes = await axios.get(`/admin/elections`, {
                    headers: { Authorization: adminToken }
                });
                const now = new Date();
                const currentLive = electionsRes.data.elections.find(e => 
                    new Date(e.start_time) <= now && new Date(e.end_time) >= now
                );
                setLiveElection(currentLive || null);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if(adminToken && isActive) {
            fetchData();
        }
    }, [adminToken, isActive]);

    return (
        <div className="space-y-8">
            {/* 1. Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Voters" 
                    value={loading ? '...' : stats.totalVoters} 
                    icon={<Users className="h-6 w-6" />} 
                    color="blue"
                />
                <StatCard 
                    title="Active Elections" 
                    value={loading ? '...' : stats.activeElections} 
                    icon={<Vote className="h-6 w-6" />} 
                    color="green"
                />
                <StatCard 
                    title="Candidates" 
                    value={loading ? '...' : stats.totalCandidates} 
                    icon={<FileText className="h-6 w-6" />} 
                    color="orange"
                />
            </div>

            {/* 2. LIVE Election Status (Conditional) */}
            {liveElection ? (
                <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="h-32 w-32 text-red-600" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                LIVE NOW
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{liveElection.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                                Ends on: {new Date(liveElection.end_time).toLocaleString()}
                            </p>
                        </div>
                        <button 
                            onClick={() => setCurrentPage('results')}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                        >
                            Monitor Live Results <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">No Elections Currently Live</h3>
                        <p className="text-gray-500 text-sm">Schedule a new election to get started.</p>
                    </div>
                    <button 
                        onClick={() => setCurrentPage('elections')}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                    >
                        Schedule Now <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* 3. Quick Actions Grid */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => setCurrentPage('elections')}
                        className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all text-left flex items-start gap-4"
                    >
                        <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-600 transition-colors">
                            <Plus className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Create New Election</h4>
                            <p className="text-sm text-gray-500 mt-1">Set up a new State or Parliamentary election.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setCurrentPage('candidates')}
                        className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all text-left flex items-start gap-4"
                    >
                        <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-600 transition-colors">
                            <Upload className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Upload Candidates</h4>
                            <p className="text-sm text-gray-500 mt-1">Bulk upload candidate CSVs and party symbols.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ElectionsPage = ({ adminToken, isActive }) => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);

  const [formState, setFormState] = useState({
      name: '',
      type: 'STATE_LEGISLATIVE',
      startTime: '',
      endTime: '',
      enabledConstituencies: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/elections`, {
        headers: { Authorization: adminToken }
      });
      setElections(response.data.elections);
    } catch (error) {
      console.error("Error fetching elections", error);
      setFormError('Could not fetch elections. Your session might be invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken && isActive) {
        fetchElections();
    }
  }, [adminToken, isActive]);

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCreateElection = async (e) => {
      e.preventDefault();
      setFormError('');
      setFormSuccess('');
      setIsCreating(true);

      const autoGeneratedId = Math.floor(Date.now() / 1000);

      try {
          const payload = {
              ...formState,
              electionId: autoGeneratedId,
              startTime: new Date(formState.startTime).toISOString(),
              endTime: new Date(formState.endTime).toISOString(),
              enabled_constituencies: formState.enabledConstituencies.split(',').map(item => parseInt(item.trim())).filter(Number.isInteger)
          };
          
          await axios.post(`/admin/elections`, payload, {
              headers: { Authorization: adminToken }
          });
          
          setFormSuccess(`Success! Election created with ID: ${autoGeneratedId}`);
          setFormState({ name: '', type: 'STATE_LEGISLATIVE', startTime: '', endTime: '', enabledConstituencies: '' });
          fetchElections();
      } catch (err) {
          setFormError(err.response?.data?.error || 'Failed to create election.');
      } finally {
          setIsCreating(false);
      }
  };

  const now = new Date();
  const ongoingElections = elections.filter(e => new Date(e.start_time) <= now && new Date(e.end_time) >= now);
  const upcomingElections = elections.filter(e => new Date(e.start_time) > now);
  const completedElections = elections.filter(e => new Date(e.end_time) < now);

  const ElectionList = ({ title, elections, titleColor = 'text-gray-900' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${titleColor}`}>{title}</h3>
      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <div className="divide-y divide-gray-100">
          {elections.length > 0 ? elections.map(e => (
            <div key={e.election_id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between md:items-center hover:bg-gray-50 transition rounded-lg px-2 -mx-2">
                <div className="mb-2 md:mb-0">
                    <p className="font-semibold text-gray-900">{e.name}</p>
                    <div className="flex gap-2 text-xs text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">ID: {e.election_id}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{e.type}</span>
                    </div>
                </div>
                <div className="text-sm text-gray-500 text-left md:text-right">
                    <p>Starts: {new Date(e.start_time).toLocaleString()}</p>
                    <p>Ends: {new Date(e.end_time).toLocaleString()}</p>
                </div>
            </div>
          )) : <p className="text-sm text-gray-400 italic">No elections in this category.</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-6 text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-indigo-600" />
            Create New Election
        </h3>
        <form onSubmit={handleCreateElection} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Election Name</label>
                    <input name="name" type="text" value={formState.name} onChange={handleInputChange} placeholder="e.g. General Assembly 2025" required 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Election Type</label>
                    <select name="type" value={formState.type} onChange={handleInputChange} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition">
                        <option value="STATE_LEGISLATIVE">State Legislative</option>
                        <option value="PARLIAMENTARY">Parliamentary</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Constituency IDs</label>
                    <input name="enabledConstituencies" type="text" value={formState.enabledConstituencies} onChange={handleInputChange} placeholder="1, 2, 3 (comma-separated)" 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input name="startTime" type="datetime-local" value={formState.startTime} onChange={handleInputChange} required 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input name="endTime" type="datetime-local" value={formState.endTime} onChange={handleInputChange} required 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isCreating} 
                className="w-full bg-indigo-600 text-white py-3 font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isCreating ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Election...
                    </>
                ) : (
                    "Auto-Generate ID & Create Election"
                )}
            </button>
            
            {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{formError}</div>}
            {formSuccess && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{formSuccess}</div>}
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ElectionList title="Ongoing Elections" elections={ongoingElections} titleColor="text-green-600" />
        <ElectionList title="Upcoming Elections" elections={upcomingElections} titleColor="text-blue-600" />
        <ElectionList title="Completed Elections" elections={completedElections} titleColor="text-gray-500" />
      </div>
    </div>
  );
};

const CandidatesPage = ({ adminToken, isActive }) => {
    const [file, setFile] = useState(null); 
    const [symbolFiles, setSymbolFiles] = useState(null); 
    const [electionId, setElectionId] = useState('');
    const [electionType, setElectionType] = useState('ac');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [elections, setElections] = useState([]);

    useEffect(() => {
        const fetchElections = async () => {
            try {
                const res = await axios.get(`/admin/elections`, {
                    headers: { Authorization: adminToken },
                });
                setElections(res.data.elections);
            } catch (err) {
                console.error("Failed to fetch elections for dropdown:", err);
            }
        };
        if (adminToken && isActive) fetchElections();
    }, [adminToken, isActive]);


    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !electionId) {
            setError("Please select an Election and a CSV file.");
            return;
        }
        setLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('electionId', electionId);
        formData.append('electionType', electionType);
        formData.append('candidatesCsv', file);

        if (symbolFiles && symbolFiles.length > 0) {
          for (let i = 0; i < symbolFiles.length; i++) {
            formData.append('symbols', symbolFiles[i]);
          }
        }

        try {
            const response = await axios.post(`/admin/candidates/upload`, formData, {
                headers: { 'Authorization': adminToken }
            });
            setMessage(`Upload complete! Added: ${response.data.added}, Skipped: ${response.data.skipped}, Failed: ${response.data.failed}`);
            setFile(null);
            setSymbolFiles(null);
            e.target.reset(); 
        } catch (err) {
            setError(err.response?.data?.error || 'File upload failed.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Candidates & Symbols</h3>
            <p className="text-sm text-gray-500 mb-6">
                Upload the candidates CSV and associated party symbols. CSV must contain `candidateName`, `party_name`, `symbol`, and `assemblyId`/`parliamentaryId`.
            </p>

            <form onSubmit={handleUpload} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Election</label>
                        <select 
                            value={electionId} 
                            onChange={e => setElectionId(e.target.value)} 
                            required
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        >
                            <option value="">-- Select Election --</option>
                            {elections.map(e => (
                                <option key={e.election_id} value={e.election_id}>
                                    {e.name} (ID: {e.election_id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Election Type</label>
                        <select value={electionType} onChange={e => setElectionType(e.target.value)} 
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition">
                            <option value="ac">Assembly (ac)</option>
                            <option value="pc">Parliamentary (pc)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Candidates CSV File</label>
                    <input type="file" name="candidatesCsvInput" onChange={e => setFile(e.target.files[0])} accept=".csv" required 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Symbol Images (PNG, JPG)</label>
                    <input type="file" name="symbolsInput" onChange={e => setSymbolFiles(e.target.files)} accept=".png,.jpg,.jpeg" multiple 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-md shadow-indigo-100">
                    {loading ? 'Uploading...' : 'Start Upload'}
                </button>
                
                {message && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 text-center">{message}</div>}
                {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center">{error}</div>}
            </form>
        </div>
    );
};

const ResultsPage = ({ adminToken, isActive }) => {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [constituencyResults, setConstituencyResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ws = useRef(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await axios.get(`/admin/elections`, {
          headers: { Authorization: adminToken },
        });
        setElections(res.data.elections);
      } catch (err) {
        console.error("Failed to fetch elections:", err);
      }
    };
    if (adminToken && isActive) fetchElections();
  }, [adminToken, isActive]);

  const handleElectionSelect = async (electionId) => {
    setSelectedElectionId(electionId);
    setSummary(null);
    setConstituencyResults([]);
    setConstituencyId("");
    if (!electionId) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`/admin/results/summary/${electionId}`, {
        headers: { Authorization: adminToken },
      });
      setSummary(res.data);
    } catch (err) {
      setError("Failed to fetch election summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchConstituencyResults = async (e) => {
    e.preventDefault();
    if (!constituencyId) return;
    setLoading(true);

    try {
      const res = await axios.get(`/admin/results/${selectedElectionId}/${constituencyId}`, {
        headers: { Authorization: adminToken },
      });
      const sorted = (res.data.results || []).sort((a, b) => b.votes - a.votes);
      setConstituencyResults(sorted);
    } catch (err) {
      setError("Failed to fetch constituency results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive || !selectedElectionId) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsHost;
    try {
      const backendUrl = new URL(import.meta.env.VITE_API_URL || window.location.origin);
      wsHost = backendUrl.hostname === "backend" ? window.location.hostname + ":5000" : window.location.host; 
    } catch {
      wsHost = window.location.host;
    }

    const wsUrl = `${wsProtocol}//${wsHost}/ws`;
    let reconnectTimer;
    let isMounted = true; 

    const connect = () => {
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
            
            // Update Summary
            setSummary((prev) =>
              prev && Number(electionId) === Number(prev.election.election_id)
                ? { ...prev, votersVoted: prev.votersVoted + 1 }
                : prev
            );

            // Update Constituency List
            setConstituencyResults((prev) =>
              prev.map((r) =>
                Number(r.candidate_id) === Number(candidateId) // Ensure matching naming convention
                  ? { ...r, votes: Number(r.votes) + 1 }
                  : r
              ).sort((a, b) => b.votes - a.votes) // Re-sort on fly
            );
          }
        } catch (err) {
          console.error("WS Error:", err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
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
  }, [isActive, selectedElectionId]);

  const handleBreakTie = async () => {
    if (!summary?.tieDetected) return;
    setLoading(true);
    try {
      const res = await axios.post(`/admin/results/break-tie`,
        { electionId: selectedElectionId, tiedParties: summary.tiedParties },
        { headers: { Authorization: adminToken } }
      );
      toast.success(`🎉 Winner decided: ${res.data.winningParty.name}`);
      handleElectionSelect(selectedElectionId);
    } catch (err) {
      setError("Failed to resolve tie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Election to Monitor</label>
        <select value={selectedElectionId} onChange={(e) => handleElectionSelect(e.target.value)} 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg">
            <option value="">-- Choose an Election --</option>
            {elections.map((e) => (
            <option key={e.election_id} value={e.election_id}>
                {e.name} (ID: {e.election_id})
            </option>
            ))}
        </select>
      </div>

      {loading && <div className="text-center py-8"><div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div></div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center">{error}</div>}

      {summary && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Eligible Voters" value={summary.totalVoters} icon={<Users className="h-6 w-6" />} color="blue" />
                <StatCard title="Votes Cast" value={summary.votersVoted} icon={<Vote className="h-6 w-6" />} color="green" />
            </div>

            {summary.isElectionOver ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 text-green-700 flex items-center gap-2"><Shield className="h-5 w-5"/> Final Results</h3>
                    {summary.tieDetected ? (
                        <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-100">
                            <h4 className="font-bold text-orange-800 mb-2">Tie Detected</h4>
                            <button onClick={handleBreakTie} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition">
                                Initiate Draw of Lots
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center p-4 bg-green-50 rounded-xl border border-green-100">
                            <span className="text-sm text-green-600 uppercase font-bold tracking-wider">Winner</span>
                            <span className="text-3xl font-bold text-green-900 mt-1">{summary.winningParty.name}</span>
                            <span className="text-green-700 font-medium">{summary.winningParty.votes.toLocaleString()} Votes</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-center font-medium">
                    Election is Live. Results update in real-time.
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Constituency Lookup</h3>
                <form onSubmit={handleFetchConstituencyResults} className="flex gap-4">
                    <input type="number" value={constituencyId} onChange={(e) => setConstituencyId(e.target.value)} placeholder="Constituency ID" 
                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition">Fetch</button>
                </form>

                {constituencyResults.length > 0 && (
                    <div className="mt-6 space-y-3">
                        {constituencyResults.map((c, i) => (
                            <div key={c.candidate_id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-gray-400 w-6">#{i + 1}</div>
                                    <img src={c.symbol ? `/symbols/${c.symbol.split('/').pop()}` : ''} alt="" className="w-10 h-10 object-contain bg-white rounded-full p-1 border" onError={(e) => e.target.style.display='none'} />
                                    <div>
                                        <p className="font-bold text-gray-900">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.party_name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600 text-lg">{c.votes}</p>
                                    <p className="text-[10px] text-gray-400 uppercase">Votes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

// --- Main Admin Dashboard Component ---
const AdminDashboard = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const adminToken = sessionStorage.getItem('adminToken');

    const handleLogout = () => {
        sessionStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    };

    useEffect(() => {
        if (!adminToken) {
            window.location.href = '/admin/login';
        }
    }, [adminToken]);

    if (!adminToken) return null;

    const SidebarItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => { setCurrentPage(id); setIsMobileMenuOpen(false); }}
            title={isCollapsed ? label : ''}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 mb-1 rounded-xl text-sm font-medium transition-all ${
                currentPage === id ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${currentPage === id ? 'text-indigo-600' : 'text-gray-400'}`} />
            {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg"><Shield className="h-5 w-5 text-white" /></div>
                    <span className="font-bold text-lg">iBallot Admin</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 bg-gray-100 rounded-lg">
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 ease-in-out flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
            `}>
                <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-gray-100 hidden lg:flex`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg shrink-0"><Shield className="h-6 w-6 text-white" /></div>
                        {!isCollapsed && <span className="text-xl font-bold whitespace-nowrap">iBallot</span>}
                    </div>
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <SidebarItem id="home" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem id="elections" icon={Vote} label="Manage Elections" />
                    <SidebarItem id="candidates" icon={Users} label="Upload Candidates" />
                    <SidebarItem id="results" icon={FileText} label="View Results" />
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} title={isCollapsed ? "Logout" : ""}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'} px-4 py-2 border border-red-100 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all`}>
                        <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} /> 
                        {!isCollapsed && "Logout"}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 z-10 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            {currentPage === 'home' && 'Dashboard Overview'}
                            {currentPage === 'elections' && 'Election Management'}
                            {currentPage === 'candidates' && 'Candidate Directory'}
                            {currentPage === 'results' && 'Live Election Results'}
                        </h1>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* ✅ UPDATED: Passed setCurrentPage to HomePage */}
                        <div style={{ display: currentPage === 'home' ? 'block' : 'none' }}>
                            <HomePage adminToken={adminToken} isActive={currentPage === 'home'} setCurrentPage={setCurrentPage} />
                        </div>
                        <div style={{ display: currentPage === 'elections' ? 'block' : 'none' }}>
                            <ElectionsPage adminToken={adminToken} isActive={currentPage === 'elections'} />
                        </div>
                        <div style={{ display: currentPage === 'candidates' ? 'block' : 'none' }}>
                            <CandidatesPage adminToken={adminToken} isActive={currentPage === 'candidates'} />
                        </div>
                        <div style={{ display: currentPage === 'results' ? 'block' : 'none' }}>
                            <ResultsPage adminToken={adminToken} isActive={currentPage === 'results'} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;