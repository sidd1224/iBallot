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

const AdminLayout = ({ children, setCurrentPage, handleLogout }) => (
    <div className="min-h-screen bg-gray-100 flex font-sans">
        <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col shadow-lg">
            <h1 className="text-2xl font-bold mb-8 border-b border-gray-700 pb-4">iBallot Admin</h1>
            <nav className="flex-grow">
                <ul>
                    <li className="mb-2"><button onClick={() => setCurrentPage('home')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">Dashboard</button></li>
                    <li className="mb-2"><button onClick={() => setCurrentPage('elections')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">Manage Elections</button></li>
                    <li className="mb-2"><button onClick={() => setCurrentPage('candidates')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">Upload Candidates</button></li>
                    <li className="mb-2"><button onClick={() => setCurrentPage('results')} className="w-full text-left font-semibold hover:bg-gray-700 p-3 rounded transition-colors">View Results</button></li>
                </ul>
            </nav>
            <div>
                <button onClick={handleLogout} className="w-full text-left bg-red-600 hover:bg-red-700 p-3 font-bold rounded transition-colors">Logout</button>
            </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">
            {children}
        </main>
    </div>
);


// --- Page-Specific Components ---

const HomePage = ({ adminToken }) => {
    // This page can display summary statistics from your eciData route
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Voters" value="-" icon="👥" />
                <StatCard title="Active Elections" value="-" icon="🗳️" />
                <StatCard title="Candidates Registered" value="-" icon="🧑‍💼" />
            </div>
             <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-xl mb-4">Welcome, Admin!</h3>
                <p className="text-gray-600">Use the navigation menu on the left to manage the iBallot application. You can create new elections, upload lists of candidates for specific constituencies, and view the final results once an election has concluded.</p>
             </div>
        </div>
    );
};

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
  }, [adminToken]);

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
              enabled_constituencies: formState.enabledConstituencies.split(',').map(item => parseInt(item.trim())).filter(Number.isInteger)
          };

          await axios.post(`${apiUrl}/admin/elections`, payload, {
              headers: { Authorization: adminToken }
          });
          
          setFormSuccess('Election created successfully!');
          setFormState({ electionId: '', name: '', type: 'STATE_LEGISLATIVE', startTime: '', endTime: '', enabledConstituencies: '' }); // Reset form
          fetchElections(); // Refresh the list
      } catch (err) {
          setFormError(err.response?.data?.error || 'Failed to create election.');
          console.error(err);
      }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Manage Elections</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-4 text-gray-700">Create New Election</h3>
        <form onSubmit={handleCreateElection} className="space-y-4">
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-4 text-gray-700">Existing Elections</h3>
        {loading ? <p>Loading elections...</p> : (
          <div className="divide-y divide-gray-200">
            {elections.length > 0 ? elections.map(e => (
              <div key={e.election_id} className="p-3 flex justify-between items-center">
                  <div>
                      <p className="font-semibold">{e.name}</p>
                      <p className="text-sm text-gray-500">ID: {e.election_id} | Type: {e.type}</p>
                  </div>
                  <div className="text-sm text-right">
                      <p><strong>Starts:</strong> {new Date(e.start_time).toLocaleDateString()}</p>
                      <p><strong>Ends:</strong> {new Date(e.end_time).toLocaleDateString()}</p>
                  </div>
              </div>
            )) : <p className="text-gray-500">No elections found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const CandidatesPage = ({ adminToken }) => {
    const [file, setFile] = useState(null);
    const [electionId, setElectionId] = useState('');
    const [electionType, setElectionType] = useState('ac');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

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
        <div>
            <h2 className="text-3xl font-bold mb-6">Upload Candidates via CSV</h2>
            <form onSubmit={handleUpload} className="bg-white p-8 rounded-lg shadow-md space-y-6">
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
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 font-semibold rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                    {loading ? 'Uploading...' : 'Upload Candidates'}
                </button>
                {message && <p className="text-green-600 text-center font-semibold">{message}</p>}
                {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
            </form>
        </div>
    );
};

const ResultsPage = ({ adminToken }) => {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">View Election Results</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <p className="text-gray-600">This section will allow you to select an election and view the live results as they are tallied on the blockchain.</p>
            </div>
        </div>
    );
};


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

