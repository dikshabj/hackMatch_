import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Key, Lock, ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, null, {
        params: { email: email.trim() }
      });
      setMessage({ type: 'success', text: 'OTP sent successfully to your email!' });
      setStep(2);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || 'Failed to send OTP. User not found?';
      setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Recovery failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, null, {
        params: { email: email.trim(), otp: otp.trim() }
      });
      setMessage({ type: 'success', text: 'OTP verified! Now reset your password.' });
      setStep(3);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || 'Invalid or expired OTP.';
      setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        email: email.trim(),
        otp,
        newPassword
      });
      setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || 'Failed to reset password.';
      setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Reset failed. check inputs.' });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden pt-20">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-maroon/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl font-space font-bold border-l-4 border-maroon pl-3">
            Account Recovery
          </h2>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1 w-12 rounded-full transition-all duration-500 ${
                step >= s ? 'bg-maroon shadow-neon' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
            {message.text}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <p className="text-gray-400 text-sm">Enter your email address to receive a 6-digit verification code.</p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                />
              </div>
              <button disabled={loading} type="submit" className="w-full btn-maroon py-3 flex items-center justify-center gap-2">
                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <p className="text-gray-400 text-sm">We've sent a code to <span className="text-white font-medium">{email}</span>. Check your inbox.</p>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon" size={18} />
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition-all tracking-[0.5em] font-mono text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button disabled={loading} type="submit" className="w-full btn-maroon py-3">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button 
                type="button" 
                onClick={handleSendOtp}
                className="w-full text-xs text-maroon hover:text-maroon-light transition-colors uppercase tracking-widest text-center"
              >
                Resend Code
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <p className="text-gray-400 text-sm">Almost there! Set a new strong password for your account.</p>
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="New Password"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="Confirm New Password"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button disabled={loading} type="submit" className="w-full btn-maroon py-3 mt-4">
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors">
              Return to Login
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
