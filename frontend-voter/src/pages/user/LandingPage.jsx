import React, { useState } from 'react';
import { Shield, Lock, Globe, Menu, X, ArrowRight, Fingerprint, ChevronRight } from 'lucide-react';
import Login from './Login'; 

// --- Components ---

const Navbar = ({ onViewChange, currentView, isMenuOpen, setIsMenuOpen }) => (
  <nav className="bg-white shadow-sm sticky top-0 z-[100]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => {
            onViewChange('landing');
            setIsMenuOpen(false);
          }}
        >
          <div className="bg-indigo-600 p-2 rounded-lg mr-2 shrink-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="font-bold text-xl sm:text-2xl text-gray-900 tracking-tight">iBallot</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onViewChange('landing')} className={`text-sm font-medium transition-colors ${currentView === 'landing' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
            Home
          </button>
          <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Features</a>
          <a href="#security" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Security</a>
          <button 
            onClick={() => onViewChange('login')}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md flex items-center"
          >
            Voter Login <ChevronRight className="ml-1 h-4 w-4" />
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
      <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top-5 duration-200 absolute w-full left-0 shadow-lg z-50">
        <div className="px-4 pt-2 pb-6 space-y-2">
          <button 
            onClick={() => { onViewChange('landing'); setIsMenuOpen(false); }}
            className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
          >
            Home
          </button>
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Features</a>
          <a href="#security" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Security</a>
          <div className="pt-4 border-t border-gray-100 mt-2">
            <button 
              onClick={() => { onViewChange('login'); setIsMenuOpen(false); }}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-base font-medium hover:bg-indigo-700 shadow-md flex justify-center items-center"
            >
              Voter Login <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )}
  </nav>
);

const Hero = ({ onViewChange }) => (
  <div className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-32 lg:pb-28">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        Next-Gen Blockchain Voting System
      </div>
      
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
        Secure. Transparent. <br className="hidden sm:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Verifiable Democracy.</span>
      </h1>
      
      <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        Cast your vote with confidence using our encrypted, blockchain-backed platform. Verified via DigiLocker for absolute integrity.
      </p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
        <button 
          onClick={() => onViewChange('login')}
          className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-1"
        >
          Vote Now
        </button>
        <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
          Learn How It Works
        </button>
      </div>
    </div>

    {/* Background Decorations */}
    <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>
  </div>
);

const Features = () => (
  <div id="features" className="py-24 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Why Choose iBallot?</h2>
        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Built for Integrity at Scale
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
            <Lock className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Blockchain Security</h3>
          <p className="text-gray-500 leading-relaxed">
            Every vote is recorded on an immutable ledger, ensuring that once a vote is cast, it cannot be altered or deleted by anyone.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
            <Fingerprint className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Biometric & Govt ID</h3>
          <p className="text-gray-500 leading-relaxed">
            Integrated with DigiLocker and Aadhaar to ensure one-person-one-vote. Prevents voter fraud through rigorous identity checks.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
            <Globe className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Accessible Anywhere</h3>
          <p className="text-gray-500 leading-relaxed">
            Vote from the comfort of your home or anywhere in the world securely. No need to stand in long queues at polling booths.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Shield className="h-5 w-5 text-white" /></div>
            <span className="text-2xl font-bold">iBallot</span>
          </div>
          <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
            Empowering democracy through technology. Secure, transparent, and accessible voting for everyone.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Platform</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Verify Vote</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Legal</h4>
          <ul className="space-y-3 text-sm text-gray-400">
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
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {renderView()}
    </div>
  );
};

export default LandingPage;