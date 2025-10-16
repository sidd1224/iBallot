import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- UI Helper Components ---

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center transition-transform hover:scale-105">
        <div className="mr-4 text-4xl text-indigo-500">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const AdminLayout = ({ children, setCurrentPage, handleLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleNavClick = (page) => {
        setCurrentPage(page);
        setSidebarOpen(false); // Close sidebar on mobile after navigation
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-gray-800 text-white rounded-md"
                aria-label="Open menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white p-4 flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">iBallot Admin</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1 text-white"
                        aria-label="Close menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="flex-grow">
                    <ul>
                        <li className="mb-2"><button onClick={() => handleNavClick('home')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">Dashboard</button></li>
                        <li className="mb-2"><button onClick={() => handleNavClick('elections')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">Manage Elections</button></li>
                        <li className="mb-2"><button onClick={() => handleNavClick('candidates')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">Upload Candidates</button></li>
                        <li className="mb-2"><button onClick={() => handleNavClick('results')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">View Results</button></li>
                    </ul>
                </nav>
                <div>
                    <button onClick={handleLogout} className="w-full text-left bg-red-600 hover:bg-red-700 p-3 font-bold rounded transition-colors">Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-8 md:ml-64">
                {children}
            </main>

            {/* Overlay for mobile */}
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"></div>}
        </div>
    );
};


// --- Page-Specific Components ---

const HomePage = ({ adminToken }) => {
    const [stats, setStats] = useState({ totalVoters: 0, activeElections: 0, totalCandidates: 0 });
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${apiUrl}/admin/dashboard/summary`, {
                    headers: { Authorization: adminToken }
                });
                if (response.data.success) {
                    setStats(response.data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        if(adminToken) {
            fetchStats();
        }
    }, [adminToken, apiUrl]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Voters" value={loading ? '...' : stats.totalVoters} icon="👥" />
                <StatCard title="Active Elections" value={loading ? '...' : stats.activeElections} icon="🗳️" />
                <StatCard title="Candidates Registered" value={loading ? '...' : stats.totalCandidates} icon="🧑‍💼" />
            </div>
             <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-xl mb-4">Welcome, Admin!</h3>
                <p className="text-gray-600">Use the navigation menu on the left to manage the iBallot application. You can create new elections, upload lists of candidates for specific constituencies, and view the final results once an election has concluded.</p>
             </div>
        </div>
    );
};
// frontend/src/pages/admin/adminDashboard.jsx

// ... (imports and other components are unchanged)

// frontend/src/pages/admin/adminDashboard.jsx

// ... (imports and other components are unchanged)
// frontend/src/pages/admin/adminDashboard.jsx

// ... (imports and other components are unchanged)
// frontend/src/pages/admin/adminDashboard.jsx

// ... (imports and other components are unchanged)

const ElectionsPage = ({ adminToken }) => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
      electionId: '',
      name: '',
      type: 'STATE_LEGISLATIVE',
      startTime: '',
      endTime: '',
      enabledConstituencies: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/admin/elections`, {
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
    if (adminToken) {
        fetchElections();
    }
  }, [adminToken, apiUrl]);

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCreateElection = async (e) => {
      e.preventDefault();
      setFormError('');
      setFormSuccess('');
      try {
          const payload = {
              ...formState,
              electionId: parseInt(formState.electionId),
              startTime: new Date(formState.startTime).toISOString(),
              endTime: new Date(formState.endTime).toISOString(),
              enabled_constituencies: formState.enabledConstituencies.split(',').map(item => parseInt(item.trim())).filter(Number.isInteger)
          };
          await axios.post(`${apiUrl}/admin/elections`, payload, {
              headers: { Authorization: adminToken }
          });
          setFormSuccess('Election created successfully!');
          setFormState({ electionId: '', name: '', type: 'STATE_LEGISLATIVE', startTime: '', endTime: '', enabledConstituencies: '' });
          fetchElections();
      } catch (err) {
          setFormError(err.response?.data?.error || 'Failed to create election.');
          console.error(err);
      }
  };

  // --- NEW: Logic to categorize elections ---
  const now = new Date();
  const ongoingElections = elections.filter(e => new Date(e.start_time) <= now && new Date(e.end_time) >= now);
  const upcomingElections = elections.filter(e => new Date(e.start_time) > now);
  const completedElections = elections.filter(e => new Date(e.end_time) < now);

  // --- NEW: Reusable component to render a list of elections ---
  const ElectionList = ({ title, elections, titleColor = 'text-gray-700' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className={`font-bold text-lg mb-4 ${titleColor}`}>{title}</h3>
      {loading ? <p>Loading...</p> : (
        <div className="divide-y divide-gray-200">
          {elections.length > 0 ? elections.map(e => (
            <div key={e.election_id} className="p-3 flex flex-col md:flex-row justify-between md:items-center">
                <div className="mb-2 md:mb-0">
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-sm text-gray-500">ID: {e.election_id} | Type: {e.type}</p>
                </div>
                <div className="text-sm text-left md:text-right">
                    <p><strong>Starts:</strong> {new Date(e.start_time).toLocaleString()}</p>
                    <p><strong>Ends:</strong> {new Date(e.end_time).toLocaleString()}</p>
                </div>
            </div>
          )) : <p className="text-gray-500">No elections in this category.</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Manage Elections</h2>
      
      {/* Create Election Form (unchanged) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-4 text-gray-700">Create New Election</h3>
        <form onSubmit={handleCreateElection} className="space-y-4">
            {/* ... form inputs ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="electionId" type="number" value={formState.electionId} onChange={handleInputChange} placeholder="Election ID (e.g., 101)" required className="p-2 border rounded" />
                <input name="name" type="text" value={formState.name} onChange={handleInputChange} placeholder="Election Name" required className="p-2 border rounded" />
                <select name="type" value={formState.type} onChange={handleInputChange} className="p-2 border rounded">
                    <option value="STATE_LEGISLATIVE">State Legislative</option>
                    <option value="PARLIAMENTARY">Parliamentary</option>
                </select>
                <input name="enabledConstituencies" type="text" value={formState.enabledConstituencies} onChange={handleInputChange} placeholder="Enabled Constituency IDs (comma-separated)" className="p-2 border rounded" />
                <div>
                    <label className="text-sm text-gray-500">Start Time</label>
                    <input name="startTime" type="datetime-local" value={formState.startTime} onChange={handleInputChange} required className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="text-sm text-gray-500">End Time</label>
                    <input name="endTime" type="datetime-local" value={formState.endTime} onChange={handleInputChange} required className="w-full p-2 border rounded" />
                </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white p-3 font-semibold rounded hover:bg-indigo-700 transition-colors">Create Election</button>
            {formError && <p className="text-red-500 text-center">{formError}</p>}
            {formSuccess && <p className="text-green-500 text-center">{formSuccess}</p>}
        </form>
      </div>

      {/* --- NEW: Categorized Election Lists --- */}
      <ElectionList title="🟢 Ongoing Elections" elections={ongoingElections} titleColor="text-green-700" />
      <ElectionList title="🔵 Upcoming Elections" elections={upcomingElections} titleColor="text-blue-700" />
      <ElectionList title="⚫ Completed Elections" elections={completedElections} titleColor="text-gray-700" />
    </div>
  );
};

// ... (rest of the file is unchanged)
const CandidatesPage = ({ adminToken }) => {
    const [file, setFile] = useState(null);
    const [electionId, setElectionId] = useState('');
    const [electionType, setElectionType] = useState('ac');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    // --- State for multiple symbol files ---
    const [symbolFiles, setSymbolFiles] = useState([]);
    const [symbolUploadMessage, setSymbolUploadMessage] = useState('');
    const [symbolUploadError, setSymbolUploadError] = useState('');
    const [symbolLoading, setSymbolLoading] = useState(false);
    const [uploadedSymbolPaths, setUploadedSymbolPaths] = useState([]);

    // --- Handler for multiple symbol uploads ---
    const handleSymbolUpload = async (e) => {
        e.preventDefault();
        if (symbolFiles.length === 0) {
            setSymbolUploadError("Please select one or more image files.");
            return;
        }
        setSymbolLoading(true);
        setSymbolUploadMessage('');
        setSymbolUploadError('');
        setUploadedSymbolPaths([]);

        const formData = new FormData();
        for (let i = 0; i < symbolFiles.length; i++) {
            formData.append('symbols', symbolFiles[i]);
        }


        try {
            const response = await axios.post(`${apiUrl}/admin/candidates/upload-symbol`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': adminToken
                }
            });
            setSymbolUploadMessage(`✅ ${response.data.filePaths.length} symbols uploaded!`);
            setUploadedSymbolPaths(response.data.filePaths);
        } catch (err) {
            setSymbolUploadError('Symbol upload failed. Please try again.');
            console.error(err);
        } finally {
            setSymbolLoading(false);
        }
    };


    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !electionId) {
            setError("Please provide an Election ID and select a CSV file.");
            return;
        }
        setLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('electionId', electionId);
        formData.append('electionType', electionType);

        try {
            const response = await axios.post(`${apiUrl}/admin/candidates/upload`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': adminToken
                }
            });
            setMessage(`Upload complete! Added: ${response.data.added}, Failed: ${response.data.failed}`);
        } catch (err) {
            setError('File upload failed. The server responded with an error.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-6">Manage Candidates</h2>
            
            {/* --- UPDATED: Symbol Upload Section --- */}
            <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Step 1: Upload Party Symbols</h3>
                <form onSubmit={handleSymbolUpload}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Symbol Images (PNG, JPG)</label>
                        <input type="file" onChange={e => setSymbolFiles(e.target.files)} accept=".png,.jpg,.jpeg" className="w-full p-2 border border-gray-300 rounded mt-1" required multiple />
                    </div>
                    <button type="submit" disabled={symbolLoading} className="w-full bg-gray-600 text-white p-3 font-semibold rounded hover:bg-gray-700 disabled:bg-gray-400 transition-colors">
                        {symbolLoading ? 'Uploading Symbols...' : 'Upload Symbols'}
                    </button>
                    {symbolUploadMessage && <p className="text-green-600 text-center font-semibold">{symbolUploadMessage}</p>}
                    {symbolUploadError && <p className="text-red-600 text-center font-semibold">{symbolUploadError}</p>}
                    {uploadedSymbolPaths.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-100 rounded">
                            <h4 className="font-semibold text-gray-800">Uploaded Symbol Paths:</h4>
                            <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                                {uploadedSymbolPaths.map(path => <li key={path}>{path}</li>)}
                            </ul>
                        </div>
                    )}
                </form>
            </div>


            {/* Existing CSV Upload Section */}
            <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
                 <h3 className="text-xl font-bold text-gray-800">Step 2: Upload Candidates CSV</h3>
                <form onSubmit={handleUpload}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Election ID</label>
                        <input type="number" value={electionId} onChange={e => setElectionId(e.target.value)} placeholder="e.g., 101" className="w-full p-2 border border-gray-300 rounded mt-1" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Election Type</label>
                        <select value={electionType} onChange={e => setElectionType(e.target.value)} className="w-full p-2 border border-gray-300 rounded mt-1">
                            <option value="ac">Assembly (ac)</option>
                            <option value="pc">Parliamentary (pc)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Candidates CSV File</label>
                        <input type="file" onChange={e => setFile(e.target.files[0])} accept=".csv" className="w-full p-2 border border-gray-300 rounded mt-1" required />
                        <p className="text-xs text-gray-500 mt-1">CSV must contain columns: `candidateName`, `party_name`, `symbol` (with the path from Step 1), and either `assemblyId` or `parliamentaryId`.</p>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 font-semibold rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                        {loading ? 'Uploading...' : 'Upload Candidates CSV'}
                    </button>
                    {message && <p className="text-green-600 text-center font-semibold">{message}</p>}
                    {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
                </form>
            </div>
        </div>
    );
};

const ResultsPage = ({ adminToken }) => {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  
  const [constituencyId, setConstituencyId] = useState('');
  const [constituencyResults, setConstituencyResults] = useState([]);
  
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/elections`, {
          headers: { Authorization: adminToken }
        });
        setElections(response.data.elections);
      } catch (err) {
        console.error("Failed to fetch elections:", err);
      }
    };
    if (adminToken) fetchElections();
  }, [adminToken, apiUrl]);

  const handleElectionSelect = async (electionId) => {
    setSelectedElectionId(electionId);
    setSummary(null);
    setConstituencyResults([]);
    setConstituencyId('');
    if (!electionId) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${apiUrl}/admin/results/summary/${electionId}`, {
        headers: { Authorization: adminToken }
      });
      setSummary(response.data);
    } catch (err) {
      setError('Failed to fetch election summary.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFetchConstituencyResults = async (e) => {
      e.preventDefault();
      if (!constituencyId) return;
      setLoading(true);
      
      try {
          const response = await axios.get(`${apiUrl}/admin/results/${selectedElectionId}/${constituencyId}`, {
              headers: { Authorization: adminToken }
          });
          setConstituencyResults(response.data.results);
      } catch (err) {
          setError('Failed to fetch constituency results.');
      } finally {
          setLoading(false);
      }
  };

  // --- NEW: Function to handle the tie-breaker ---
  const handleBreakTie = async () => {
    if (!summary?.tieDetected) return;
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiUrl}/admin/results/break-tie`, {
        electionId: selectedElectionId,
        tiedParties: summary.tiedParties
      }, {
        headers: { Authorization: adminToken }
      });

      alert(`Draw of lots complete! The winner is: ${response.data.winningParty.name}`);
      // Refresh the summary to show the final winner
      handleElectionSelect(selectedElectionId);

    } catch (err) {
      setError('Failed to resolve the tie. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">View Election Results</h2>
      
      <div className="mb-8">
        <label className="block text-lg font-medium text-gray-700">Select an Election</label>
        <select
          value={selectedElectionId}
          onChange={(e) => handleElectionSelect(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mt-1 text-lg"
        >
          <option value="">-- Choose an Election --</option>
          {elections.map(e => (
            <option key={e.election_id} value={e.election_id}>
              {e.name} (ID: {e.election_id})
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-center">Loading results...</p>}
      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}

      {summary && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-xl mb-4">Voter Turnout</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard title="Total Eligible Voters" value={summary.totalVoters} icon="👥" />
              <StatCard title="Total Votes Cast" value={summary.votersVoted} icon="🗳️" />
            </div>
          </div>

          {summary.isElectionOver ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-xl mb-4 text-green-700">Final Results</h3>
                
                {/* --- NEW: Tie-breaker UI --- */}
                {summary.tieDetected ? (
                  <div className="text-center p-4 bg-orange-100 rounded-lg">
                    <h4 className="font-bold text-lg text-orange-800">A Tie Has Occurred!</h4>
                    <p className="text-orange-700 my-2">The following parties have the same number of votes:</p>
                    <ul className="font-semibold">
                      {summary.tiedParties.map(p => <li key={p.name}>{p.name} ({p.votes.toLocaleString()} votes)</li>)}
                    </ul>
                    <button onClick={handleBreakTie} className="mt-4 bg-orange-500 text-white font-bold py-2 px-4 rounded hover:bg-orange-600">
                      Initiate Draw of Lots to Decide Winner
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StatCard title="Winning Party (Overall)" value={summary.winningParty.name} icon="🏆" />
                      <StatCard title="Total Votes for Winner" value={summary.winningParty.votes.toLocaleString()} icon="⭐" />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-xl mb-4">Constituency Breakdown</h3>
                <form onSubmit={handleFetchConstituencyResults} className="flex items-end gap-4 mb-4">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700">Constituency ID</label>
                      <input
                        type="number"
                        value={constituencyId}
                        onChange={e => setConstituencyId(e.target.value)}
                        placeholder="Enter ID (e.g., 101)"
                        className="w-full p-2 border border-gray-300 rounded mt-1"
                      />
                    </div>
                    <button type="submit" className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700">Fetch</button>
                </form>

                {constituencyResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Results for Constituency #{constituencyId}</h4>
                    {constituencyResults.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className="font-bold w-8">{i + 1}.</span>
                          <img src={`${apiUrl}${c.symbol}`} alt="" className="w-8 h-8 object-contain mr-3"/>
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-sm text-gray-500">{c.party_name}</p>
                          </div>
                        </div>
                        <span className="font-bold text-lg">{c.votes.toLocaleString()} Votes</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-yellow-100 p-6 rounded-lg shadow-md text-center">
              <p className="font-semibold text-yellow-800">The election is still in progress. Final results and breakdowns will be available after it ends.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ... (rest of the file is unchanged)
// --- Main Admin Dashboard Component ---
const AdminDashboard = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const navigate = useNavigate();
    const adminToken = sessionStorage.getItem('adminToken');

    const handleLogout = () => {
        sessionStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    useEffect(() => {
        if (!adminToken) {
            navigate('/admin/login');
        }
    }, [adminToken, navigate]);

    const renderPage = () => {
        switch (currentPage) {
            case 'elections': return <ElectionsPage adminToken={adminToken} />;
            case 'candidates': return <CandidatesPage adminToken={adminToken} />;
            case 'results': return <ResultsPage adminToken={adminToken} />;
            default: return <HomePage adminToken={adminToken} />;
        }
    };
    
    if (!adminToken) {
        return null;
    }

    return (
        <AdminLayout setCurrentPage={setCurrentPage} handleLogout={handleLogout}>
            {renderPage()}
        </AdminLayout>
    );
};

export default AdminDashboard;

