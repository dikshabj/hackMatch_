import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Trophy, Settings, ArrowRight, Zap, Target, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    connections: 0,
    activeProjects: 0,
    hackathons: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [meRes, receivedRes, acceptedRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/requests/received'),
        api.get('/requests/accepted')
      ]);
      
      setUser(meRes.data);
      const pendingCount = receivedRes.data.filter(r => r.status === 'PENDING').length;
      const connectionsCount = acceptedRes.data.length;

      setStats({
        connections: connectionsCount,
        activeProjects: meRes.data.skills?.length || 0,
        pendingRequests: pendingCount
      });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError("System failure: Could not reconcile user identity.");
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
        setLoading(false);
    }
  };

  const menuItems = [
    { title: "Find Teammates", desc: "Discover developers based on your skills.", icon: Users, path: "/search", color: "maroon" },
    { title: "My Hackathons", desc: "View and manage your registered events.", icon: Trophy, path: "/hackathons", color: "white" },
    { title: "Profile Settings", desc: "Update your identity and tech stack.", icon: Settings, path: "/profile", color: "white" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="animate-pulse w-16 h-16 rounded-full bg-maroon/20 border border-maroon/40" />
      </div>
    );
  }

  if (error || !user) {
    return (
        <div className="min-h-screen pt-28 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-black uppercase mb-4 tracking-tighter text-white">Neural Link Severed</h2>
          <p className="text-gray-500 font-inter mb-8 max-w-sm">{error || "Access denied by central terminal."}</p>
          <button 
              onClick={() => navigate('/login')}
              className="px-10 py-3 bg-maroon text-white rounded-xl font-space font-bold text-xs uppercase tracking-widest shadow-neon"
          >
              RE-INITIALIZE LOGIN
          </button>
        </div>
      );
  }

  const handleSync = async () => {
    try {
      setLoading(true);
      const res = await api.post('/users/sync');
      setUser(res.data);
      alert("Sync complete! Your GitHub and LeetCode stats are updated.");
    } catch (err) {
      console.error("Sync failed", err);
      alert("Sync failed! Check your usernames in profile settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-maroon/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-maroon/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Welcome Back, <span className="text-maroon">{user?.name || "Operative"}</span></h1>
            <p className="text-gray-400 font-inter text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> System status: Operational
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSync}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-space font-bold uppercase tracking-widest hover:bg-maroon hover:text-white transition-all shadow-neon-sm"
          >
            <Zap size={16} />
            Sync Intelligence
          </motion.button>
        </header>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Connections", value: stats.connections, icon: Users, path: "/messages" },
            { label: "AI Match Score", value: "98%", icon: Target, path: "/search" },
            { label: "Pending Requests", value: stats.pendingRequests, icon: MessageSquare, path: "/notifications" }
          ].map((stat, idx) => (
            <Link key={stat.label} to={stat.path || '#'}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 border-white/5 bg-white/[0.03] backdrop-blur-xl hover:border-maroon/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-space font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                  <stat.icon size={18} className="text-maroon" />
                </div>
                <div className="text-3xl font-black text-white">{stat.value}</div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Action Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {menuItems.map((item, idx) => (
            <Link key={item.title} to={item.path}>
              <motion.div
                whileHover={{ y: -5, borderColor: 'rgba(128,0,0,0.5)' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`glass-card p-8 border-white/5 bg-white/[0.02] flex flex-col h-full group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  item.color === 'maroon' ? 'bg-maroon text-white shadow-neon' : 'bg-white/5 text-maroon group-hover:bg-maroon group-hover:text-white'
                }`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm font-inter leading-relaxed mb-6 flex-1">{item.desc}</p>
                <div className="flex items-center gap-2 text-[10px] font-space font-bold uppercase tracking-widest text-maroon group-hover:text-white transition-colors">
                  Initialize <ArrowRight size={14} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Quick Suggestion Area */}
        <div className="glass-card p-8 border-maroon/20 bg-gradient-to-br from-maroon/5 to-transparent relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Zap size={40} className="text-maroon opacity-20" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                   <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Expand Your <span className="text-maroon">Alliance</span></h2>
                   <p className="text-gray-400 font-inter text-sm max-w-xl">Our AI matching engine has identified new teammates that fit your profile specs. Check them out in the discovery terminal.</p>
                </div>
                <Link to="/search">
                    <button className="px-8 py-4 bg-maroon rounded-xl font-space font-bold text-xs text-white shadow-neon flex items-center gap-3 hover:bg-maroon-dark transition-all">
                        OPEN SEARCH TERMINAL
                        <ArrowRight size={18} />
                    </button>
                </Link>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
