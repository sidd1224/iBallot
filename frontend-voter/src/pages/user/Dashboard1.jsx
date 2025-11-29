import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, Vote, FileText, Settings, LogOut, 
  Bell, User, ChevronRight, Clock, CheckCircle, AlertCircle, Calendar 
} from 'lucide-react';
import axios from 'axios'; // Import axios for API calls

const Dashboard = () => {
  // Initial State with default/placeholder data
  const [user, setUser] = useState({ name: 'Loading...', voterId: '...' });
  const [stats, setStats] = useState({ activeRegistrations: 0, electionsParticipated: 0, upcomingElections: 0 });
  const [elections, setElections] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Dashboard Data on Component Mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = sessionStorage.getItem('token'); // Use sessionStorage as per your login flow
        if (!token) {
          // Handle unauthenticated state (e.g., redirect to login)
          console.warn("No token found, redirecting...");
          return;
        }

        // Fetch data from the backend route we just updated
        const response = await axios.get('/api/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        setUser(data.user);
        setStats(data.stats);
        setElections(data.elections);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard info.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live': return 'bg-red-100 text-red-700 border-red-200';
      case 'Upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all ${
        activeTab === id 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`h-5 w-5 mr-3 ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`} />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your secure dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">iBallot</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="elections" icon={Vote} label="Elections" />
          <SidebarItem id="history" icon={FileText} label="Voting History" />
          <SidebarItem id="settings" icon={Settings} label="Settings" />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center p-3 rounded-xl bg-gray-50 mb-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate" title={user.uidHash ? `UID: ${user.uidHash}` : ''}>
                ID: {user.uidHash ? `${user.uidHash.substring(0, 10)}...` : 'Unknown'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 flex items-center justify-between p-4 sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">iBallot</span>
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <span className="sr-only">Open menu</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {user.name || 'Voter'}</h1>
                <p className="mt-1 text-sm text-gray-500">Here's what's happening with your elections today.</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-white rounded-full bg-gray-100 transition-all">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <LayoutDashboard className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">Total</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.activeRegistrations + stats.upcomingElections}</h3>
                <p className="text-sm text-gray-500 mt-1">Eligible Elections</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-emerald-50 p-3 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Completed</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.electionsParticipated}</h3>
                <p className="text-sm text-gray-500 mt-1">Elections Participated</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700">Active</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.activeRegistrations}</h3>
                <p className="text-sm text-gray-500 mt-1">Live Elections Now</p>
              </div>
            </div>

            {/* Recent Elections Table/List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Upcoming & Live Elections</h2>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="divide-y divide-gray-100">
                {elections.length > 0 ? (
                  elections.map((election) => (
                    <div key={election.id} className="p-6 hover:bg-gray-50 transition-colors block sm:flex justify-between items-center group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Vote className="h-6 w-6 text-gray-600 group-hover:text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{election.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{election.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {election.date} - {election.endDate}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end w-full sm:w-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(election.status)}`}>
                          {election.status}
                        </span>
                        
                        {/* Render Actions based on Status & Vote History */}
                        {election.status === 'Live' && !election.hasVoted && (
                          <button className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all">
                            Vote Now
                          </button>
                        )}
                        
                        {election.hasVoted && (
                          <div className="ml-4 flex items-center text-emerald-600 text-sm font-medium px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Voted
                          </div>
                        )}

                        {election.status === 'Upcoming' && (
                          <button className="ml-4 text-gray-500 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-white transition-all">
                            Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No active elections found for your constituency.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;