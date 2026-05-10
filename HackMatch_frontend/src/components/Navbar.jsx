import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, User, LogOut, LayoutDashboard, Menu, X, Bell, MessageSquare } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Role helpers
  const isOrganizer = user?.roles?.some((r) => r.name === 'ROLE_ORGANIZER');
  const dashboardPath = isOrganizer ? '/organizer/dashboard' : '/dashboard';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    if (token) fetchUnreadCount();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [token, location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: dashboardPath, icon: LayoutDashboard, matchPaths: ['/dashboard', '/organizer/dashboard'] },
    { name: 'Find Team', path: '/search', icon: Search, matchPaths: ['/search'] },
    { name: 'Comms', path: '/messages', icon: MessageSquare, matchPaths: ['/messages'] },
    { name: 'Events', path: '/hackathons', icon: Trophy, matchPaths: ['/hackathons'] },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      scrolled ? 'py-2' : 'py-4'
    }`}>
      <div className="w-full px-4">
        <div className={`relative flex items-center justify-between px-6 h-14 rounded-xl border transition-all duration-500 ${
          scrolled 
            ? 'background-blur-xl bg-black/60 border-maroon/30 shadow-[0_0_30px_rgba(128,0,0,0.15)]' 
            : 'bg-transparent border-transparent'
        }`}>
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              className="w-10 h-10 bg-maroon rounded-xl flex items-center justify-center shadow-neon relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              <span className="text-white font-orbitron font-black text-xl relative">H</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-white font-orbitron font-extrabold text-xl tracking-tighter leading-none">
                HACK<span className="text-maroon">MATCH</span>
              </span>
              <span className="text-[10px] text-maroon font-orbitron tracking-[0.2em] font-bold uppercase mt-1">
                Alliance
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.matchPaths
                ? link.matchPaths.some((p) => location.pathname.startsWith(p))
                : location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-4 py-2 group overflow-hidden rounded-lg`}
                >
                  <div className="flex items-center gap-2 relative z-10">
                    <link.icon size={16} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-maroon group-hover:text-white'}`} />
                    <span className={`font-orbitron text-xs uppercase tracking-widest transition-colors duration-300 ${
                      isActive ? 'text-white font-bold' : 'text-gray-400 group-hover:text-white'
                    }`}>
                      {link.name}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-maroon shadow-neon rounded-lg -z-0"
                    />
                  )}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-maroon w-0 group-hover:w-full transition-all duration-300"
                  />
                </Link>
              );
            })}

            <div className="w-[1px] h-6 bg-white/10 mx-4" />

            <Link
              to="/profile"
              className={`w-9 h-9 rounded-xl border border-maroon/20 hover:border-maroon/60 transition-all duration-300 group overflow-hidden ${
                location.pathname === '/profile' ? 'bg-maroon/20 border-maroon' : 'bg-transparent'
              }`}
            >
              {user?.image ? (
                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={18} className="text-maroon group-hover:text-white transition-colors" />
                </div>
              )}
            </Link>

            <Link 
              to="/notifications"
              className={`relative p-2 rounded-full border border-maroon/20 hover:border-maroon/60 transition-all duration-300 group ml-2 ${
                location.pathname === '/notifications' ? 'bg-maroon/20' : 'bg-transparent'
              }`}
            >
              <Bell size={18} className="text-maroon group-hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <div className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-maroon rounded-full border border-black flex items-center justify-center -translate-y-1/3 translate-x-1/3">
                  <span className="text-[10px] font-bold text-white px-1">{unreadCount}</span>
                </div>
              )}
            </Link>

            <button 
              onClick={handleLogout}
              className="ml-4 p-2 text-gray-500 hover:text-maroon transition-all duration-300 hover:rotate-12"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-6 right-6 p-6 rounded-2xl bg-black/95 border border-maroon/30 backdrop-blur-2xl md:hidden flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 text-white font-orbitron text-sm uppercase tracking-widest"
              >
                <link.icon className="text-maroon" />
                {link.name}
              </Link>
            ))}
            <Link
                to="/notifications"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 text-white font-orbitron text-sm uppercase tracking-widest"
              >
                <Bell className="text-maroon" />
                Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Link>
            <button
                onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                }}
                className="flex items-center gap-4 text-maroon font-orbitron text-sm uppercase tracking-widest"
              >
                <LogOut />
                Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
