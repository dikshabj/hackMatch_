import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ArrowRight, Trophy, Users, Check, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ROLES = [
  {
    id: 'participant',
    roleName: 'ROLE_STUDENT',
    icon: Users,
    title: 'Participant',
    subtitle: 'Join hackathons & find teammates',
    perks: ['Find AI-matched teammates', 'Join hackathons', 'Build your portfolio'],
    color: 'from-blue-900/30 to-transparent',
    border: 'border-blue-500/40',
    glow: 'shadow-blue-900/40',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'organizer',
    roleName: 'ROLE_ORGANIZER',
    icon: Trophy,
    title: 'Organizer',
    subtitle: 'Host & manage hackathon events',
    perks: ['Create & publish hackathons', 'Find volunteers & team', 'Access organizer dashboard'],
    color: 'from-maroon/30 to-transparent',
    border: 'border-maroon/50',
    glow: 'shadow-maroon/40',
    iconBg: 'bg-maroon',
  },
];

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('participant');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('role') === 'organizer') {
      setSelectedRole('organizer');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = ROLES.find((r) => r.id === selectedRole);
      const payload = {
        ...formData,
        roles: [{ name: role.roleName }],
      };
      await api.post('/auth/register', payload);
      // Redirect to login with hint about which role
      navigate('/login', { state: { registered: true, role: selectedRole } });
    } catch (err) {
      console.error(err);
      alert('Registration Failed! ' + (err.response?.data?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const chosenRole = ROLES.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-maroon/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-900/10 blur-[100px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <motion.div
              key="role-step"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="glass-card p-8 md:p-10 border-white/10 bg-black/40 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-maroon to-transparent" />

              <div className="text-center mb-8">
                <p className="text-[10px] font-space font-bold uppercase tracking-[0.25em] text-gray-500 mb-2">Step 1 of 2</p>
                <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
                  Choose Your <span className="text-maroon">Role</span>
                </h1>
                <p className="text-gray-500 text-xs font-inter">How will you use HackMatch?</p>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <motion.button
                      key={role.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(role.id)}
                      className={`relative w-full text-left p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 ${
                        isSelected
                          ? `${role.border} ${role.color} shadow-lg ${role.glow}`
                          : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="role-check"
                          className="absolute top-4 right-4 w-6 h-6 bg-maroon rounded-full flex items-center justify-center"
                        >
                          <Check size={13} className="text-white" />
                        </motion.div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? role.iconBg : 'bg-white/5'} transition-colors`}>
                          <Icon size={22} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-base uppercase tracking-tight mb-1">{role.title}</h3>
                          <p className="text-gray-500 text-xs font-inter mb-3">{role.subtitle}</p>
                          <ul className="space-y-1">
                            {role.perks.map((perk) => (
                              <li key={perk} className="flex items-center gap-2 text-[11px] text-gray-400 font-inter">
                                <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-maroon' : 'bg-gray-600'}`} />
                                {perk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-maroon rounded-xl font-space font-black text-white shadow-neon flex items-center justify-center gap-2 group hover:bg-maroon-dark transition-all duration-300"
              >
                CONTINUE AS {chosenRole?.title.toUpperCase()}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <p className="mt-6 text-center text-xs text-gray-500 font-inter">
                Already verified?{' '}
                <Link to="/login" className="text-maroon hover:underline font-bold">
                  Access Vault
                </Link>
              </p>
            </motion.div>
          )}

          {/* STEP 2: Registration Form */}
          {step === 2 && (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="glass-card p-8 md:p-10 border-white/10 bg-black/40 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${
                  chosenRole?.id === 'organizer' ? 'via-maroon' : 'via-blue-500'
                } to-transparent`}
              />

              {/* Back + Role Badge */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-white transition-colors text-[10px] font-space uppercase tracking-widest flex items-center gap-1"
                >
                  ← Back
                </button>
                <div
                  className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-space font-bold uppercase tracking-widest ${
                    chosenRole?.id === 'organizer'
                      ? 'border-maroon/40 text-maroon bg-maroon/10'
                      : 'border-blue-500/40 text-blue-400 bg-blue-900/20'
                  }`}
                >
                  {React.createElement(chosenRole?.icon, { size: 11 })}
                  {chosenRole?.title}
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="text-[10px] font-space font-bold uppercase tracking-[0.25em] text-gray-500 mb-2">Step 2 of 2</p>
                <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">
                  New <span className="text-maroon">Identity</span>
                </h1>
                <p className="text-gray-500 text-xs font-space tracking-widest uppercase">
                  {chosenRole?.id === 'organizer' ? 'Create your organizer account' : 'Create your nexus account'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Codename</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-maroon transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-maroon/50 focus:bg-maroon/5 transition-all font-inter text-sm"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Identity (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-maroon transition-colors" size={18} />
                    <input
                      type="email"
                      placeholder="name@nexus.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-maroon/50 focus:bg-maroon/5 transition-all font-inter text-sm"
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
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
                  {/* Forgot password link on signup too */}
                  <div className="flex justify-end mt-1">
                    <Link
                      to="/forgot-password"
                      className="text-[10px] text-gray-500 hover:text-maroon transition-colors uppercase tracking-widest font-bold"
                    >
                      Forgot existing password?
                    </Link>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-maroon rounded-xl font-space font-black text-white shadow-neon flex items-center justify-center gap-2 group hover:bg-maroon-dark transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      CREATE IDENTITY
                      <UserPlus size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Signup;
