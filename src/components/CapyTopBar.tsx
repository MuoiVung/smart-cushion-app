import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

const fmt = (secs: number) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const CapyTopBar: React.FC = () => {
  const { url, status, lastMessage, connect, disconnect, discover } = useWebSocket();
  const { user, refreshUser, isDemo } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const msg = lastMessage;
  const occupied = msg?.occupancy_state === 'occupied';
  const session = msg?.session_duration_sec ?? 0;

  const isConnected = status === 'connected';

  const handleToggleCoaching = async () => {
    if (isConnected) {
      // Session results
      const durationMin = (msg?.session_duration_sec || 0) / 60;
      const accuracy = msg?.posture_accuracy_score || 0;

      disconnect();

      // Submit results to cloud to get gems
      if (user && !isDemo && durationMin > 0.1) { // Min 6 seconds to count
        try {
          const res = await fetch(`${API_BASE_URL}/user/gems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username,
              duration_min: durationMin,
              accuracy: accuracy
            })
          });
          if (res.ok) {
            const data = await res.json();
            refreshUser({ gems: data.totalGems });
            console.log(`Earned ${data.earned} gems!`);
          }
        } catch (err) {
          console.error("Failed to sync gems", err);
        }
      }
    } else {
      setIsConnecting(true);
      try {
        if (url) {
          connect(url);
        } else {
          const discoveredUrl = await discover();
          if (discoveredUrl) connect(discoveredUrl);
        }
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="bg-capy-brown text-capy-card flex items-center justify-between px-6 md:px-10 py-3 shadow-sm z-40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${occupied ? 'bg-capy-success' : 'bg-capy-card/40'}`} />
          <span className="text-sm">
            <span className="text-capy-card/70">Cushion:</span>{' '}
            <span className={occupied ? 'text-capy-success font-bold' : 'text-capy-card/70'}>
              {occupied ? 'Active' : isConnected ? 'Idle' : 'Offline'}
            </span>
          </span>
        </div>
        
        {isDemo && (
          <div className="bg-capy-amber/20 border border-capy-amber/40 text-capy-amber text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
            Demo Mode
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-widest text-capy-card/70 font-black mb-0.5">Live Session</p>
          <p className="font-mono font-bold text-lg tracking-widest leading-none">{fmt(session)}</p>
        </div>
        
        <button 
          onClick={handleToggleCoaching}
          disabled={isConnecting}
          className="border border-capy-card/40 text-capy-card hover:bg-capy-card/10 rounded-xl px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Stop' : 'Connect'}
        </button>
      </div>
    </div>
  );
};
