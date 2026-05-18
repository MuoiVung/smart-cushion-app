import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { TransparentImage } from '../components/TransparentImage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user.username, data.user.role, data.user.gems, data.user.collection, data.user.free_spins);
        navigate('/');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    login('Demo Guest', 'demo', 100, [], 10);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-capy-bg flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-capy-amber/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-capy-success/10 rounded-full blur-3xl animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full z-10"
      >
        <div className="text-center mb-8">
          <div className="w-28 h-28 bg-capy-brown rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl p-2 overflow-hidden border-4 border-white/10">
            <TransparentImage src="/assets/capybara/postures/nup.png" alt="Capy Logo" className="w-full h-full object-contain brightness-110" />
          </div>
          <h1 className="text-4xl font-black text-capy-brown-3 tracking-tighter">Capy Login</h1>
          <p className="text-capy-muted font-medium mt-2 italic">Connect with your Smart Cushion</p>
        </div>

        <div className="bg-capy-card border border-capy-border rounded-[2.5rem] p-8 shadow-2xl shadow-capy-brown/5">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-capy-muted mb-2 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="smartcushion"
                className="w-full bg-capy-bg border border-capy-border rounded-2xl px-5 py-4 text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-amber/50 transition-all placeholder:opacity-30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-capy-muted mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-capy-bg border border-capy-border rounded-2xl px-5 py-4 text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-amber/50 transition-all placeholder:opacity-30"
                required
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-capy-danger text-xs font-bold text-center bg-capy-danger/5 py-2 rounded-lg border border-capy-danger/10"
              >
                ⚠ {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-capy-brown text-white font-black py-4 rounded-2xl shadow-lg shadow-capy-brown/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login to Dashboard'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center">
            <div className="w-full flex items-center gap-4 mb-6">
              <div className="h-px bg-capy-border flex-1" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-capy-muted">Or try as Guest</span>
              <div className="h-px bg-capy-border flex-1" />
            </div>

            <button
              onClick={handleDemo}
              className="group flex items-center gap-2 text-sm font-bold text-capy-brown hover:text-capy-amber transition-colors"
            >
              <span className="bg-capy-amber-soft p-1.5 rounded-lg group-hover:bg-capy-amber/20 transition-colors text-base">🎮</span>
              Demo User (View Only)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
