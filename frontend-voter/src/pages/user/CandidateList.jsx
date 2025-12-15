import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  User, 
  ArrowLeft, 
  AlertCircle,
  Vote
} from "lucide-react";
import VoteSuccessModal from "../../components/VoteSuccessModal";

const CandidateList = () => {
  const { electionId, assemblyId } = useParams();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [password, setPassword] = useState("");
  const [voteError, setVoteError] = useState("");

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txHash, setTxHash] = useState(null);

  // ✅ 1. Memoize user to prevent infinite re-renders
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  }, []);

  const token = useMemo(() => sessionStorage.getItem("token"), []);
  
  const ws = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    }
  }, [navigate, user, token]);

  // ✅ 2. Robust WebSocket Connection Logic
  useEffect(() => {
    let wsUrl;
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const backendUrl = new URL(apiUrl || window.location.origin);
      
      let wsHost;
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      if (backendUrl.hostname === "backend") {
          if (isLocalDev) {
              wsHost = "localhost:5000"; 
          } else {
              // Auto-fix for Docker/Cloud environments
              const currentHost = window.location.hostname;
              if (currentHost.includes('frontend')) {
                  wsHost = currentHost.replace('frontend-voter', 'backend').replace('frontend', 'backend');
              } else {
                  wsHost = window.location.host;
              }
          }
      } else {
          wsHost = backendUrl.host;
      }

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${wsProtocol}//${wsHost}/ws`;
    } catch (err) {
      console.error("WS Config Error:", err);
      wsUrl = `ws://${window.location.host}/ws`;
    }

    // Prevent duplicate connections
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    console.log("🔌 Connecting to WebSocket:", wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("✅ WebSocket Connected");
    };

    // ✅ 3. DEBUG & CONFIRMATION LOGIC
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "VOTE_CONFIRMED") {
          console.log("📩 Received Blockchain Confirmation:", data.payload);

          // --- ROBUST COMPARISON ---
          // 1. Get Local Hash (Handle potentially missing user)
          const myRawHash = user?.uid_hash || "";
          
          // 2. Get Incoming Hash
          const incomingRawHash = data.payload.voterHash || "";

          // 3. Normalize: Lowercase + Remove '0x' prefix from both sides
          const myHash = myRawHash.toLowerCase().replace(/^0x/, "");
          const incHash = incomingRawHash.toLowerCase().replace(/^0x/, "");

          console.log(`🔍 DEBUG MATCH:`);
          console.log(`   👉 My Session Hash:   ${myHash}`);
          console.log(`   👉 Blockchain Hash:   ${incHash}`);

          // 4. Compare
          if (myHash && myHash === incHash) {
             console.log("✅ MATCH! Opening Modal.");
             
             setIsVoting(false); // Stop Spinner
             setTxHash(data.payload.txHash);
             setShowSuccessModal(true);
          } else {
             console.warn("⚠️ MISMATCH! Ignoring confirmation.");
             if (!myHash) console.warn("💡 TIP: Your session hash is empty. Try Logging out and back in.");
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    };

    ws.current.onclose = () => {
        console.log("⚠️ WebSocket Disconnected");
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [user]); // Runs when 'user' is memoized (mount)

  // Fetch Candidates
  useEffect(() => {
    let isMounted = true;
    const fetchCandidates = async () => {
      try {
        if (!token || !user?.username || !electionId || !assemblyId) {
          setError("Missing required information.");
          setLoading(false);
          return;
        }
        const res = await axios.get(`/api/candidates/${electionId}/${assemblyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted) {
          let formatted = (res.data.candidates || []).map((c) => ({
            ...c,
            symbol: c.symbol ? `/symbols/${c.symbol.split("/").pop()}` : null,
          }));
          formatted.sort((a, b) => {
            if (a.party_name === 'NOTA') return 1;
            if (b.party_name === 'NOTA') return -1;
            return 0;
          });
          setCandidates(formatted);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          sessionStorage.clear();
          navigate("/login");
        } else {
          setError("Failed to load official candidate list.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCandidates();
    return () => { isMounted = false; };
  }, [electionId, assemblyId, token, user, navigate]);

  // Handle Vote
  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedCandidate === null) {
      setVoteError("Please select a candidate before submitting.");
      return;
    }
    if (!password) {
      setVoteError("Password is required to confirm identity.");
      return;
    }

    setVoteError("");
    setIsVoting(true);

    try {
      await axios.post(
        `/api/vote`,
        {
          username: user?.username,
          password,
          electionId: parseInt(electionId),
          candidateId: selectedCandidate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Vote Queued. Waiting for Blockchain confirmation...");

    } catch (err) {
      console.error("❌ Vote error:", err);
      setIsVoting(false);
      if (err.response?.status === 401) {
        sessionStorage.clear();
        navigate("/login");
      }
      setVoteError(err.response?.data?.error || "Vote transaction failed.");
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    sessionStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading Official Ballot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Return to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          <span className="font-bold text-gray-900">iBallot Secure</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
        <div className="bg-white border-b border-gray-100 p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-xl mb-4">
            <Vote className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Official Ballot
          </h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
            Please select your preferred candidate for <span className="font-semibold text-gray-800">Election #{electionId}</span>. 
            This action is irreversible and recorded on the blockchain.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-gray-50/30">
          {error ? (
             <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center">
               <AlertCircle className="h-5 w-5 mr-2" /> {error}
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate.id)}
                    className={`
                      relative group flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ease-in-out
                      ${selectedCandidate === candidate.id 
                        ? "border-indigo-600 bg-white shadow-md ring-4 ring-indigo-50" 
                        : candidate.party_name === 'NOTA' 
                          ? "border-red-200 bg-red-50 hover:bg-red-100" 
                          : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                      }
                    `}
                  >
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-50 rounded-lg p-2 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      {candidate.symbol ? (
                        <img
                          src={candidate.symbol}
                          alt="Symbol"
                          className="w-full h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                        />
                      ) : null}
                      <User className={`h-8 w-8 text-gray-300 ${candidate.symbol ? 'hidden' : 'block'}`} />
                    </div>

                    <div className="ml-4 sm:ml-6 flex-grow min-w-0">
                      <h3 className={`text-lg sm:text-xl font-bold truncate ${candidate.party_name === 'NOTA' ? 'text-red-700' : 'text-gray-900'}`}>
                        {candidate.name}
                      </h3>
                      <p className="text-sm font-medium text-indigo-600 mt-0.5 truncate">
                        {candidate.party_name}
                      </p>
                    </div>

                    <div className={`
                      h-6 w-6 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 transition-colors
                      ${selectedCandidate === candidate.id ? "border-indigo-600 bg-indigo-600" : "border-gray-300 group-hover:border-indigo-400"}
                    `}>
                      {selectedCandidate === candidate.id && (
                        <div className="h-2.5 w-2.5 bg-white rounded-full animate-in zoom-in duration-200" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No candidates available for this election.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleVoteSubmit} className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Identity to Vote
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={selectedCandidate === null || isVoting}
                  className="block w-full pl-10 text-base sm:text-sm border-gray-300 rounded-xl p-3.5 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 border"
                  placeholder="Enter your login password"
                  required
                />
              </div>
              {voteError && (
                <p className="mt-2 text-sm text-red-600 flex items-center justify-center animate-pulse">
                  <AlertCircle className="h-4 w-4 mr-1" /> {voteError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedCandidate === null || !password || isVoting}
              className={`
                w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white transition-all
                ${selectedCandidate === null || !password || isVoting
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5"
                }
              `}
            >
              {isVoting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Vote...
                </span>
              ) : (
                <span className="flex items-center">
                  Submit Final Vote <CheckCircle className="ml-2 h-5 w-5" />
                </span>
              )}
            </button>
            
            <p className="text-xs text-center text-gray-400">
              By clicking submit, you confirm that this is your own choice and you are voting freely.
            </p>
          </form>
        </div>
      </div>

      <VoteSuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleCloseModal} 
        txHash={txHash}
      />
    </div>
  );
};

export default CandidateList;