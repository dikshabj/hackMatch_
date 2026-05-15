import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  Save, 
  Code, 
  Globe, 
  Link as LinkIcon, 
  Plus, 
  X, 
  Edit3, 
  Mail, 
  Terminal, 
  ExternalLink,
  Camera,
  Briefcase,
  CheckCircle2,
  Circle,
  Github as GithubIcon,
  Linkedin as LinkedinIcon,
  Zap
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const XPProgressBar = ({ xp, rank }) => {
  const ranks = {
    Rookie: 1000,
    Apprentice: 3000,
    Expert: 7000,
    Grandmaster: 15000,
    Legend: 30000
  };
  const nextXP = ranks[rank] || 1000;
  const progress = Math.min((xp / nextXP) * 100, 100);

  return (
    <div className="mt-4">
      <div className="flex justify-between text-[10px] font-space text-gray-500 mb-1">
        <span className="uppercase tracking-widest">XP: {xp}</span>
        <span className="uppercase tracking-widest">Target: {nextXP}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-maroon shadow-[0_0_10px_rgba(128,0,0,0.8)]"
        />
      </div>
    </div>
  );
};

const Profile = () => {
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setUserData(res.data);
      
      // Auto-sync stats if usernames are present
      if (res.data.githubUsername || res.data.leetcodeUsername) {
        handleSync();
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await api.post('/users/sync');
      setUserData(res.data);
      toast.success("Neural Stats Synchronized", {
        style: { background: '#1e293b', color: '#fff', fontSize: '10px', fontFamily: 'Space Grotesk' }
      });
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error("Only image files are accepted for neural visualization.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    const loadingToast = toast.loading("Syncing profile visual to S3 uplink...");
    
    try {
      const res = await api.post('/users/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUserData({ ...userData, image: res.data.imageUrl });
      await fetchUser();
      toast.success("Profile visual successfully synchronized.", { id: loadingToast });
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error("Uplink failed. Network interference detected.", { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !userData.skills.includes(skillInput.trim())) {
      setUserData({ ...userData, skills: [...userData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${userData.id}`, userData);
      toast.success('Identity Matrix Re-calibrated.', {
        style: { background: '#1e293b', color: '#fff' }
      });
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Identity preservation failed. Local memory only.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-pulse w-20 h-20 rounded-full bg-maroon/20 border-2 border-maroon/40 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-t-2 border-maroon animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-6 relative overflow-hidden bg-[#0a0a0a]">
      {/* Dynamic Background */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-maroon/10 blur-[150px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/5 blur-[150px] rounded-full -z-10" />
      
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black mb-3 uppercase tracking-tighter leading-tight">
              {isEditing ? "Modify" : "Identity"} <span className="text-maroon">Matrix</span>
            </h1>
            <div className="flex items-center gap-3">
                <div className="h-[2px] w-12 bg-maroon" />
                <p className="text-gray-500 font-space text-[10px] uppercase tracking-[0.2em]">
                    {isEditing ? "Adjusting Operative Parameters" : "Neural ID Status: Authenticated"}
                </p>
            </div>
          </motion.div>
          
          {!isEditing && (
            <div className="flex gap-4">
               <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSync()}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-space font-bold text-[10px] text-gray-400 flex items-center gap-2 hover:text-white transition-all"
              >
                <Zap size={14} className="text-maroon" /> SYNC NEURAL DATA
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-space font-bold text-xs text-white flex items-center gap-3 hover:bg-white/10 transition-all hover:border-maroon shadow-2xl backdrop-blur-md"
              >
                <Edit3 size={16} className="text-maroon" /> CALIBRATE PROFILE
              </motion.button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Visual ID & Role */}
            <div className="lg:col-span-1 space-y-8">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 border-white/5 bg-white/[0.02] backdrop-blur-3xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-maroon to-transparent opacity-50" />
                    
                    <div className="relative inline-block group mb-6 w-full">
                        <div className="w-40 h-40 rounded-3xl overflow-hidden border-2 border-white/10 group-hover:border-maroon transition-colors shadow-2xl mx-auto bg-gradient-to-br from-white/5 to-white/[0.02]">
                            {userData.image ? (
                                <img src={userData.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-maroon/20">
                                    <UserIcon size={60} className="text-maroon/40" />
                                </div>
                            )}
                            {isEditing && (
                                <button 
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="text-white mb-2" size={24} />
                                    <span className="text-[10px] font-space font-bold uppercase text-white">Update Visual</span>
                                </button>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>
                    
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{userData.name}</h2>
                        <p className="text-maroon font-space text-[10px] font-bold uppercase tracking-widest mb-6">
                            {userData.preferredRole || "Undefined Class"}
                        </p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-space uppercase">Tier</span>
                            <span className="px-3 py-1 bg-maroon/20 border border-maroon/30 rounded-lg text-white font-bold text-[10px] uppercase tracking-tighter">
                                {userData.rank || "Rookie"}
                            </span>
                        </div>
                        
                        <XPProgressBar xp={userData.xp || 0} rank={userData.rank || "Rookie"} />

                        <div className="flex justify-between items-center text-xs pt-2">
                            <span className="text-gray-500 font-space uppercase">Link State</span>
                            <span className={`font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 ${userData.status === 'AVAILABLE' ? 'text-green-500' : 'text-orange-500'}`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${userData.status === 'AVAILABLE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500'}`} />
                                {userData.status?.replace('_', ' ') || "READY"}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <div className="glass-card p-6 border-white/5 bg-white/[0.01] backdrop-blur-2xl">
                    <h3 className="text-[10px] font-space font-bold text-maroon uppercase tracking-[0.2em] mb-4">Neural Reach</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <a href={userData.githubLink} target="_blank" className="flex items-center gap-2 text-xs text-gray-400 font-inter hover:text-white transition-colors p-3 bg-white/5 rounded-xl border border-white/5">
                            <GithubIcon size={14} /> GitHub
                        </a>
                        <a href={userData.linkedinLink} target="_blank" className="flex items-center gap-2 text-xs text-gray-400 font-inter hover:text-white transition-colors p-3 bg-white/5 rounded-xl border border-white/5">
                            <LinkedinIcon size={14} /> LinkedIn
                        </a>
                        {userData.portfolioLink && (
                            <a href={userData.portfolioLink} target="_blank" className="col-span-2 flex items-center justify-center gap-2 text-xs text-white font-space font-bold uppercase tracking-widest hover:bg-maroon transition-all p-3 bg-maroon/20 rounded-xl border border-maroon/30 shadow-neon">
                                <ExternalLink size={14} /> Open Portfolio
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Parameters & Intel */}
            <div className="lg:col-span-2 space-y-8">
                <AnimatePresence mode="wait">
                    {!isEditing ? (
                        <motion.div 
                            key="view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Dashboard Stats */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-maroon/20 rounded-lg text-maroon">
                                            <GithubIcon size={18} />
                                        </div>
                                        <h3 className="text-[10px] font-space font-bold text-gray-300 uppercase tracking-widest">GitHub Intel</h3>
                                    </div>
                                    <div className="flex justify-around">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-white">{userData.githubStats?.repos || 0}</p>
                                            <p className="text-[9px] text-gray-500 font-space uppercase">Repos</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-white/10 self-center" />
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-white">{userData.githubStats?.followers || 0}</p>
                                            <p className="text-[9px] text-gray-500 font-space uppercase">Followers</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                            <Code size={18} />
                                        </div>
                                        <h3 className="text-[10px] font-space font-bold text-gray-300 uppercase tracking-widest">LeetCode Mastery</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 bg-green-500/5 rounded-xl text-center border border-green-500/10">
                                            <p className="text-lg font-black text-green-500">{userData.leetcodeStats?.easy || 0}</p>
                                            <p className="text-[8px] text-gray-500 font-bold">EASY</p>
                                        </div>
                                        <div className="p-2 bg-yellow-500/5 rounded-xl text-center border border-yellow-500/10">
                                            <p className="text-lg font-black text-yellow-500">{userData.leetcodeStats?.medium || 0}</p>
                                            <p className="text-[8px] text-gray-500 font-bold">MID</p>
                                        </div>
                                        <div className="p-2 bg-red-500/5 rounded-xl text-center border border-red-500/10">
                                            <p className="text-lg font-black text-red-500">{userData.leetcodeStats?.hard || 0}</p>
                                            <p className="text-[8px] text-gray-500 font-bold">HARD</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="glass-card p-8 border-white/5 bg-white/[0.02]">
                                <h3 className="text-[10px] font-space font-bold text-maroon uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <Terminal size={14} /> Operational Bio
                                </h3>
                                <div className="relative">
                                    <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-maroon/30" />
                                    <p className="text-gray-300 font-inter text-lg leading-relaxed italic pl-4">
                                        "{userData.bio || "Data corrupted or not provided."}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="glass-card p-8 border-white/5 bg-white/[0.02]">
                                    <h3 className="text-[10px] font-space font-bold text-maroon uppercase tracking-[0.2em] mb-6">Expertise Stack</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {userData.skills?.map(skill => (
                                            <span key={skill} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white font-space font-bold uppercase tracking-widest shadow-xl">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-card p-8 border-white/5 bg-white/[0.02]">
                                    <h3 className="text-[10px] font-space font-bold text-maroon uppercase tracking-[0.2em] mb-6">Active Parameters</h3>
                                    <div className="space-y-4 font-inter text-sm">
                                        <div className="flex items-center gap-4 text-gray-400">
                                            <Briefcase size={16} className="text-maroon" />
                                            <span>Preferred: <b className="text-white">{userData.preferredRole}</b></span>
                                        </div>
                                        <div className="flex items-center gap-4 text-gray-400">
                                            <Zap size={16} className="text-maroon" />
                                            <span>Encryption: <b className="text-white">{userData.status === 'DEEP_WORK' ? "Maximum (Hiding)" : "Standard"}</b></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <form onSubmit={handleSave} className="glass-card p-10 border-maroon/20 bg-white/[0.03] space-y-10">
                                <section>
                                    <h3 className="text-[10px] font-space font-bold text-maroon uppercase tracking-[0.2em] mb-6 border-b border-maroon/20 pb-2">Core Identity</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500">Public Moniker</label>
                                            <input 
                                                type="text" 
                                                value={userData.name} 
                                                onChange={e => setUserData({...userData, name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-inter text-sm focus:border-maroon focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500 font-bold">Class / Role</label>
                                            <select 
                                                value={userData.preferredRole} 
                                                onChange={e => setUserData({...userData, preferredRole: e.target.value})}
                                                className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 text-white font-inter text-sm focus:border-maroon focus:outline-none transition-all"
                                            >
                                                <option value="">Select Specialization</option>
                                                <option value="Frontend">Frontend Development</option>
                                                <option value="Backend">Backend Architecture</option>
                                                <option value="Fullstack">Fullstack Operator</option>
                                                <option value="UI/UX">UX Visualization</option>
                                                <option value="Machine Learning">Pattern Recognition / ML</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <GithubIcon size={12} /> GitHub Username
                                        </label>
                                        <input 
                                            type="text" 
                                            value={userData.githubUsername || ''} 
                                            onChange={e => setUserData({...userData, githubUsername: e.target.value})}
                                            placeholder="Your GitHub handle"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-inter text-sm focus:border-maroon focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <Code size={12} /> LeetCode Username
                                        </label>
                                        <input 
                                            type="text" 
                                            value={userData.leetcodeUsername || ''} 
                                            onChange={e => setUserData({...userData, leetcodeUsername: e.target.value})}
                                            placeholder="Your LeetCode handle"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-inter text-sm focus:border-maroon focus:outline-none transition-all"
                                        />
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500 mb-3 block">Neural Encryption (Bio)</label>
                                    <textarea 
                                        value={userData.bio} 
                                        onChange={e => setUserData({...userData, bio: e.target.value})}
                                        placeholder="Describe your operational capability..."
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-inter text-sm focus:border-maroon focus:outline-none transition-all resize-none"
                                    />
                                </section>

                                <section>
                                    <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500 mb-3 block">Neural Expertise (Skills)</label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {userData.skills?.map(skill => (
                                            <span key={skill} className="px-4 py-2 rounded-xl bg-maroon/20 border border-maroon/40 text-[10px] text-white font-space font-bold uppercase tracking-widest flex items-center gap-2">
                                                {skill}
                                                <button 
                                                    type="button"
                                                    onClick={() => setUserData({ ...userData, skills: userData.skills.filter(s => s !== skill) })}
                                                    className="hover:text-red-500 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            value={skillInput}
                                            onChange={e => setSkillInput(e.target.value)}
                                            placeholder="Add new capability (e.g. React, Python, AI)"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-inter text-sm focus:border-maroon focus:outline-none transition-all font-space uppercase"
                                            onKeyPress={e => {
                                                if(e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill(e);
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleAddSkill}
                                            className="px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-maroon hover:border-maroon transition-all group"
                                        >
                                            <Plus size={20} className="text-maroon group-hover:text-white" />
                                        </button>
                                    </div>
                                </section>

                                <section className="grid md:grid-cols-1 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500">Collaboration State</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {['AVAILABLE', 'BUSY', 'HACKING', 'DEEP_WORK'].map((status) => (
                                                <button 
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setUserData({...userData, status})}
                                                    className={`p-4 rounded-2xl border transition-all text-[10px] font-space font-bold uppercase ${userData.status === status ? 'bg-maroon/20 border-maroon text-white shadow-neon' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                >
                                                    {status.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-end gap-6 pt-6 border-t border-white/10">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditing(false)}
                                        className="text-[10px] font-space font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                                    >
                                        Abort Change
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="px-10 py-4 bg-maroon text-white rounded-2xl font-space font-bold text-xs uppercase tracking-widest shadow-neon hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        <Save size={18} /> {saving ? "PRESERVING..." : "COMMIT TO MATRIX"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
