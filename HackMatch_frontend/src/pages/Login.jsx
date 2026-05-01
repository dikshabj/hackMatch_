import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Trophy, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    if (error) console.error('Login Error from Backend:', error);

    if (token) {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      navigate('/dashboard');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.accessToken);
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      // Check role and redirect
      const roles = res.data.userDto?.roles?.map(r => r.name) || [];
      if (roles.includes('ROLE_ORGANIZER')) {
        navigate('/organizer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Login Failed! Please check your credentials.');
    }
  };

  const handleOAuthLogin = (provider) => {
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')).replace(/\/$/, '');
    window.location.href = `${backendUrl}/oauth2/authorization/${provider}`;
  };

  return (
    <div className="min-h-screen pt-28 pb-20 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-maroon/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-maroon/10 blur-[100px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10 border-maroon/20 bg-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-maroon to-transparent" />

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">
              Access <span className="text-maroon">Vault</span>
            </h1>
            <p className="text-gray-500 text-xs font-space tracking-widest uppercase">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Identity</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-maroon transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="name@nexus.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-maroon/50 focus:bg-maroon/5 transition-all font-inter text-sm"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password with eye toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-maroon transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-maroon/50 focus:bg-maroon/5 transition-all font-inter text-sm"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-maroon transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-[10px] text-maroon hover:text-maroon-light transition-colors uppercase tracking-widest font-bold"
                >
                  Forgot Identity?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-maroon rounded-xl font-space font-black text-white shadow-neon flex items-center justify-center gap-2 group hover:bg-maroon-dark transition-all duration-300 active:scale-95"
            >
              INITIALIZE LOGIN
              <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] text-gray-600 font-space uppercase">Omni-Auth</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <div className="space-y-3 mt-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="w-full py-3 rounded-xl border border-white/10 flex items-center justify-center gap-3 text-sm font-space font-bold hover:bg-white/5 transition-all"
            >
              AUTHENTICATE WITH GITHUB
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="w-full py-3 rounded-xl border border-white/10 flex items-center justify-center gap-3 text-sm font-space font-bold hover:bg-white/5 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              AUTHENTICATE WITH GOOGLE
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 font-inter">
            New to the alliance?{' '}
            <Link to="/signup" className="text-maroon hover:underline font-bold">
              Register Identity
            </Link>
          </p>

          {/* Organizer CTA */}
          <div className="mt-5 relative">
            <div className="h-px bg-white/5 mb-5" />
            <Link to="/signup?role=organizer">
              <motion.div
                whileHover={{ scale: 1.02, borderColor: 'rgba(128,0,0,0.5)' }}
                className="relative p-4 rounded-2xl border border-white/8 bg-gradient-to-r from-maroon/10 via-transparent to-maroon/5 cursor-pointer group overflow-hidden transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-maroon/50 to-transparent" />
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-maroon/20 flex items-center justify-center flex-shrink-0 group-hover:bg-maroon transition-all duration-300">
                    <Trophy size={18} className="text-maroon group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-space font-bold uppercase tracking-[0.15em] text-gray-500 mb-0.5">For Organizations</p>
                    <p className="text-sm font-bold text-white leading-tight">Want to organize a hackathon?</p>
                    <p className="text-[11px] text-gray-500 font-inter mt-0.5">Create an organizer account to host events</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-maroon group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
