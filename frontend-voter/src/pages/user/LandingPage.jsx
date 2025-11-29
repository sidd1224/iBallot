import React, { useState } from 'react';
import { Shield, Lock, Globe, Menu, X, ArrowRight, Fingerprint, ChevronRight } from 'lucide-react';
// Importing the Login component you uploaded (adjust path as needed in your project)
import Login from './Login'; 

// --- Components ---

const Navbar = ({ onViewChange, currentView, isMenuOpen, setIsMenuOpen }) => (
  <nav className="bg-white shadow-sm sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => onViewChange('landing')}
        >
          <div className="bg-indigo-600 p-2 rounded-lg mr-2">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-gray-900 tracking-tight">iBallot</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onViewChange('landing')} className={`text-sm font-medium transition-colors ${currentView === 'landing' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>Home</button>
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Live Results</button>
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">About Blockchain</button>
          <button 
            onClick={() => onViewChange('login')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center"
          >
            Voter Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-900 p-2">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </div>

    {/* Mobile Menu Dropdown */}
    {isMenuOpen && (
      <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
        <div className="px-4 pt-2 pb-6 space-y-2">
          <button onClick={() => { onViewChange('landing'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Home</button>
          <button className="block w-full text-left px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Live Results</button>
          <button className="block w-full text-left px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">About</button>
          <button 
            onClick={() => { onViewChange('login'); setIsMenuOpen(false); }}
            className="block w-full text-center mt-4 bg-indigo-600 text-white px-3 py-3 rounded-lg font-medium"
          >
            Voter Login
          </button>
        </div>
      </div>
    )}
  </nav>
);

const Hero = ({ onViewChange }) => (
  <div className="relative overflow-hidden bg-white pt-16 pb-32">
    <div className="absolute top-0 left-0 w-full h-full bg-indigo-50/50 -skew-y-3 origin-top-left z-0 transform -translate-y-24"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
        <div className="lg:col-span-6 text-center lg:text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold mb-6">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2"></span>
            Blockchain Secured Voting
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Your Voice,<br />
            <span className="text-indigo-600"> securely counted.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Participate in elections with confidence. iBallot uses advanced blockchain technology to ensure every vote is immutable, transparent, and verifiable.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <button 
              onClick={() => onViewChange('login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            >
              Cast Your Vote
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all">
              View Live Stats
            </button>
          </div>
        </div>
        
        {/* Abstract Dashboard Graphic */}
        <div className="lg:col-span-6 mt-16 lg:mt-0 relative">
          <div className="relative rounded-2xl bg-white shadow-2xl border border-gray-100 p-2 overflow-hidden transform rotate-1 hover:rotate-0 transition-all duration-500">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Live Election Dashboard</h3>
                  <p className="text-sm text-gray-500">Real-time participation metrics</p>
                </div>
                <div className="flex space-x-2">
                  <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Live</span>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase">Total Votes</p>
                  <p className="text-2xl font-bold text-indigo-600">1,245,892</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase">Turnout</p>
                  <p className="text-2xl font-bold text-emerald-600">68.4%</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                <div className="flex justify-between items-end h-24 space-x-2">
                  {[40, 65, 30, 85, 55, 45, 70].map((h, i) => (
                    <div key={i} className="w-full bg-indigo-100 rounded-t-sm relative group">
                      <div 
                        className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm transition-all duration-1000 group-hover:bg-indigo-600"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating Badge */}
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center space-x-3 max-w-xs animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="bg-green-100 p-2 rounded-full">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">System Secure</p>
              <p className="text-xs text-gray-500">256-bit encryption active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Features = () => (
  <div className="bg-gray-50 py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Why Trust iBallot?</h2>
        <p className="text-lg text-gray-600">Built on Ethereum blockchain technology, we ensure that every single vote is permanently recorded and impossible to tamper with.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <Lock className="h-8 w-8 text-indigo-600" />,
            title: "Immutable Security",
            desc: "Once a vote is cast, it is written to the blockchain. No administrator, hacker, or government can alter the count."
          },
          {
            icon: <Globe className="h-8 w-8 text-indigo-600" />,
            title: "Decentralized",
            desc: "The voting ledger is distributed across thousands of nodes, eliminating single points of failure."
          },
          {
            icon: <Fingerprint className="h-8 w-8 text-indigo-600" />,
            title: "Identity Verified",
            desc: "Integrated with DigiLocker and government databases to ensure one-person-one-vote integrity."
          }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="bg-indigo-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-indigo-400 mr-2" />
            <span className="font-bold text-xl">iBallot</span>
          </div>
          <p className="text-gray-400 max-w-sm">
            Empowering democracy through technology. The world's most secure decentralized voting platform.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Platform</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Voter Login</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Admin Portal</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Results</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Legal</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} iBallot Inc. All rights reserved.
      </div>
    </div>
  </footer>
);

// --- Main App Component ---

const LandingPage = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Simple view router
  const renderView = () => {
    switch(currentView) {
      case 'landing':
        return (
          <>
            <Navbar 
              onViewChange={setCurrentView} 
              currentView={currentView}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
            <div className="animate-in fade-in duration-500">
              <Hero onViewChange={setCurrentView} />
              <Features />
              <Footer />
            </div>
          </>
        );
      case 'login':
        return (
          <div className="animate-in slide-in-from-right duration-500">
            {/* Use the uploaded Login component */}
            <Login />
          </div>
        );
      default:
        return <Hero onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="font-sans antialiased text-gray-900 bg-white min-h-screen">
      {renderView()}
    </div>
  );
};

export default LandingPage;