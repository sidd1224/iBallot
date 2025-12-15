import React from 'react';
import { CheckCircle, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

const VoteSuccessModal = ({ isOpen, onClose, txHash }) => {
  if (!isOpen) return null;

  // ✅ Defensive Coding: Use empty string if txHash is null/undefined
  const safeHash = txHash || "";
  const explorerUrl = `https://amoy.polygonscan.com/tx/${safeHash}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Vote Confirmed!</h3>
              <p className="text-gray-500 mb-6">
                Your vote has been successfully recorded on the Polygon Blockchain.
              </p>

              {/* ✅ Conditional Rendering: Only show receipt if hash exists */}
              {safeHash ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-2">Transaction Receipt</p>
                  <a 
                    href={explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 font-mono text-sm break-all transition-colors"
                  >
                    {/* Now slice is safe because safeHash is a string */}
                    {safeHash.slice(0, 16)}...{safeHash.slice(-16)}
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg text-yellow-700 text-sm mb-6 border border-yellow-200">
                  <p>Vote confirmed, but transaction receipt is pending.</p>
                  <p className="text-xs mt-1">Please check your dashboard shortly.</p>
                </div>
              )}

              <div className="bg-indigo-50 rounded-lg p-3 flex items-start text-left">
                <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-indigo-700">
                  This cryptographic proof ensures your vote is immutable and cannot be tampered with by anyone.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              onClick={onClose}
            >
              Securely Logout <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteSuccessModal;