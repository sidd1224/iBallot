import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Elections from './Elections';
import {
  Shield,
  LayoutDashboard,
  Vote,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  // ✅ sessionStorage usage preserved exactly
  const user = JSON.parse(sessionStorage.getItem('user'));
  const token = sessionStorage.getItem('token');
  const constituency = JSON.parse(sessionStorage.getItem('constituency'));
  const hasVoted = user?.hasVoted;

  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState({
    activeRegistrations: 0,
    electionsParticipated: 0,
    upcomingElections: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  
  // 🟢 State for Sidebar Collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🔁 Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!token) {
          setError('Missing session, please login again.');
          setLoading(false);
          navigate('/login');
          return;
        }

        const response = await axios.get('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data || {};
        setElections(data.elections || []);
        setStats(data.stats || stats);
      } catch (err) {
        console.error('❌ Dashboard API Error:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 🖼 Status badge color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'Live':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setView(id)}
      title={isCollapsed ? label : ''} // Show tooltip on hover when collapsed
      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 mb-1 rounded-xl text-sm font-medium transition-all ${
        view === id ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${view === id ? 'text-indigo-600' : 'text-gray-400'}`} />
      {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">{label}</span>}
    </button>
  );

  const handleProceedToVote = (election) => {
    let constituencyId = null;
    if (election.type === 'STATE_LEGISLATIVE') constituencyId = constituency?.ac_id;
    if (election.type === 'PARLIAMENTARY') constituencyId = constituency?.pc_id;
    if (!constituencyId) return alert('Missing constituency, login again.');
    const electionId = election.election_id ?? election.id;
    navigate(`/candidates/${electionId}/${constituencyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside 
        className={`hidden lg:flex flex-col ${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'flex-col justify-center gap-4' : 'justify-between'} border-b border-gray-100`}>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0"><Shield className="h-6 w-6 text-white" /></div>
            {!isCollapsed && <span className="text-xl font-bold whitespace-nowrap overflow-hidden transition-all">iBallot</span>}
          </div>
          
          {/* Collapse Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="elections" icon={Vote} label="Elections" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center p-3 rounded-xl bg-gray-50 mb-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className={`h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate w-32">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500">Verified Voter</p>
                </div>
            )}
          </div>

          <button
            onClick={() => { sessionStorage.clear(); navigate('/login'); }}
            title={isCollapsed ? "Sign Out" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'} px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all`}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} /> 
            {!isCollapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.username || 'Voter'} 👋</h1>
              <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening in your elections</p>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {view === 'dashboard' && (
            <>
              {/* STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <LayoutDashboard className="h-6 w-6 text-blue-600 mb-3" />
                  <div className="text-2xl font-bold">{stats.activeRegistrations + stats.upcomingElections}</div>
                  <div className="text-sm text-gray-500 mt-1">Eligible Elections</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <CheckCircle className="h-6 w-6 text-green-600 mb-3" />
                  <div className="text-2xl font-bold">{stats.electionsParticipated}</div>
                  <div className="text-sm text-gray-500 mt-1">Elections Participated</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <Clock className="h-6 w-6 text-orange-600 mb-3" />
                  <div className="text-2xl font-bold">{stats.activeRegistrations}</div>
                  <div className="text-sm text-gray-500 mt-1">Live Elections Now</div>
                </div>
              </div>

              {/* LIST */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold">Upcoming &amp; Live Elections</h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {elections.length > 0 ? (
                    elections.map((election) => (
                      <div key={election.id} className="p-6 hover:bg-gray-50 transition sm:flex justify-between items-center">
                        <div className="flex items-start gap-4">
                          <div className="bg-gray-100 p-3 rounded-xl">
                            <Vote className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold">{election.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{election.description}</p>
                            <p className="text-xs text-gray-400 mt-2 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> {election.date} - {election.endDate}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex items-center">
                          <span className={`px-3 py-1 rounded-full border text-xs ${getStatusColor(election.status)}`}>{election.status}</span>

                          {!election.hasVoted && election.status === 'Live' && (
                            <button onClick={() => handleProceedToVote(election)} className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm">
                              Vote Now
                            </button>
                          )}

                          {election.hasVoted && (
                            <div className="ml-4 flex items-center text-green-600 px-4 py-2 bg-green-50 rounded-xl border text-sm border-green-100">
                              <CheckCircle className="h-4 w-4 mr-2" /> Voted
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">No elections found.</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 🟢 Elections View */}
          {view === 'elections' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Elections />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;