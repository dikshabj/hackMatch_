import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, UserPlus, Cpu, Zap, Code, Shield, CheckCircle2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfileAlert from '../components/ProfileAlert';
import toast from 'react-hot-toast';

const Search = () => {
  const navigate = useNavigate();
  const [sentRequests, setSentRequests] = useState(new Set());
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [connectingId, setConnectingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    checkProfileState();
  }, []);

  const checkProfileState = async () => {
    try {
      const meRes = await api.get('/users/me');
      const meData = meRes.data;
      if (!meData.skills || meData.skills.length === 0) {
        setShowProfileAlert(true);
      } else {
        fetchSuggestions();
        fetchSentRequests();
      }
    } catch (err) {
      console.error('Failed to check user profile:', err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await api.get('/requests/sent');
      // Only store IDs of requests that are NOT rejected
      const sentIds = res.data
        .filter(req => req.status?.toString().toUpperCase() !== 'REJECTED')
        .map(req => req.receiver.id);
      setSentRequests(new Set(sentIds));
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setIsAiMode(true);
    try {
      const res = await api.get('/matches/suggestions');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchSuggestions();
      return;
    }
    
    setLoading(true);
    setIsAiMode(false);
    try {
      const meRes = await api.get('/users/me');
      const currentUserEmail = meRes.data.email;
      
      const res = await api.get(`/matches/search?query=${encodeURIComponent(searchQuery)}`);
      // Filter out the current user by email
      const filtered = res.data.filter(u => u.email !== currentUserEmail);
      setUsers(filtered);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    setConnectingId(userId);
    try {
      await api.post(`/requests/send/${userId}`, { message: "Hi! I'd like to connect on HackMatch." });
      setSentRequests(prev => new Set(prev).add(userId));
      
      // Update local state for immediate feedback
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, connectionStatus: 'PENDING' } : u));
      
      toast.success('Connection Request Sent!', {
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(128, 0, 0, 0.3)',
        },
        iconTheme: {
          primary: '#800000',
          secondary: '#fff',
        },
      });
    } catch (err) {
      console.error('Error connecting:', err);
      toast.error('Could not transmit request.');
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative overflow-hidden">
      <ProfileAlert isOpen={showProfileAlert} />
      
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-maroon/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-maroon/20 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-maroon text-xs font-space font-bold uppercase tracking-widest mb-6"
          >
            <Cpu size={14} /> Neural Matchmaking Active
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Find Your <span className="text-maroon">Squad</span></h1>
          <p className="text-gray-400 font-inter max-w-2xl mx-auto text-sm leading-relaxed">
            Discover elite developers, designers, and hackers. Let our AI suggest the perfect teammates or search manually by specific skills.
          </p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto mb-16 relative"
        >
          <form onSubmit={handleSearch} className="relative flex items-center">
            <SearchIcon className="absolute left-6 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by skills (e.g. React, Java, UI/UX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-32 text-white outline-none focus:border-maroon/50 focus:bg-white/10 transition-all font-inter text-sm shadow-xl backdrop-blur-md"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-6 bg-maroon hover:bg-maroon-dark transition-colors rounded-xl font-space font-bold text-xs uppercase text-white tracking-wider flex items-center gap-2"
            >
              INITIALIZE
            </button>
          </form>
        </motion.div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <h2 className="text-xl font-orbitron font-bold text-white flex items-center gap-3">
            {isAiMode ? (
              <><Zap className="text-maroon" size={20} /> AI Recommendations</>
            ) : (
              <><Code className="text-maroon" size={20} /> Search Results</>
            )}
          </h2>
          <span className="text-gray-500 text-xs font-space uppercase tracking-widest">{users.length} Operatives Found</span>
        </div>

        {/* User Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Loading Skeletons
            [...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 border-maroon/10 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-20 bg-white/5 rounded-xl mb-6" />
                <div className="flex gap-2 mb-6">
                  <div className="h-6 w-16 bg-white/10 rounded-full" />
                  <div className="h-6 w-16 bg-white/10 rounded-full" />
                </div>
                <div className="h-10 w-full bg-maroon/20 rounded-xl" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-white/5 bg-white/5 rounded-3xl backdrop-blur-lg">
              <Shield className="mx-auto text-gray-600 mb-4" size={48} />
              <h3 className="text-xl font-bold mb-2">No Operatives Found</h3>
              <p className="text-gray-500 text-sm font-inter">Try adjusting your search parameters or skills.</p>
            </div>
          ) : (
            users.map((user, idx) => (
              <motion.div
                key={user.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 border-white/5 hover:border-maroon/30 group relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-maroon/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full" />
                
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon to-black p-[2px]">
                    <div className="w-full h-full bg-black rounded-[14px] overflow-hidden flex items-center justify-center">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-orbitron font-bold text-maroon">{user.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{user.name}</h3>
                    <p className="text-xs text-gray-400 font-inter">Level 1 Hacker</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] mb-5 flex-1 relative z-10 border border-white/5">
                  <p className="text-sm text-gray-400 font-inter line-clamp-3 leading-relaxed">
                    {user.bio || "No bio provided. This operator works in the shadows."}
                  </p>
                </div>

                {isAiMode && user.matchReason && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-5 p-3 rounded-xl bg-maroon/5 border border-maroon/20 flex gap-3"
                    >
                        <Zap size={16} className="text-maroon shrink-0 mt-0.5" />
                        <p className="text-[10px] font-space font-bold uppercase tracking-tight text-white/80 leading-tight">
                            Neural Link Logic: <span className="text-maroon/80">{user.matchReason}</span>
                        </p>
                    </motion.div>
                )}

                <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="px-3 py-1 rounded-full bg-maroon/10 border border-maroon/30 text-[10px] text-maroon font-space uppercase tracking-wider font-bold">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-500 font-space uppercase tracking-wider">Unspecified</span>
                  )}
                  {user.skills && user.skills.length > 4 && (
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-500 font-space uppercase tracking-wider">
                      +{user.skills.length - 4}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => user.connectionStatus === 'ACCEPTED' ? navigate('/messages') : handleConnect(user.id)}
                  disabled={connectingId === user.id || user.connectionStatus === 'PENDING'}
                  className={`w-full py-3.5 rounded-xl border border-white/10 font-space font-bold text-xs tracking-widest text-white uppercase transition-all duration-300 relative z-10 flex items-center justify-center gap-2 disabled:opacity-50 ${
                    user.connectionStatus === 'ACCEPTED' ? 'bg-maroon border-maroon shadow-neon' :
                    user.connectionStatus === 'PENDING' ? 'bg-green-600/20 border-green-600/50 text-green-400' : 
                    'group-hover:bg-maroon group-hover:border-maroon'
                  }`}
                >
                  {connectingId === user.id 
                    ? 'Establishing Link...' 
                    : user.connectionStatus === 'ACCEPTED'
                      ? 'Message'
                      : user.connectionStatus === 'PENDING'
                        ? 'Awaiting Operator Response' 
                        : 'Connect'
                  }
                  {user.connectionStatus === 'NONE' && <UserPlus size={14} className={connectingId === user.id ? 'animate-pulse' : ''} />}
                  {user.connectionStatus === 'PENDING' && <CheckCircle2 size={14} />}
                  {user.connectionStatus === 'ACCEPTED' && <MessageSquare size={14} />}
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
