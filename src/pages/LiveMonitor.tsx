import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const POSTURE_META: Record<string, any> = {
  correct: { label: "Good", icon: "check_circle", color: "text-primary" },
  lean_left: { label: "Leaning Left", icon: "arrow_back", color: "text-secondary" },
  lean_right: { label: "Leaning Right", icon: "arrow_forward", color: "text-secondary" },
  slouch_forward: { label: "Slouching", icon: "arrow_downward", color: "text-error" },
  lean_back: { label: "Leaning Back", icon: "arrow_upward", color: "text-secondary" },
  unknown: { label: "No Person", icon: "help", color: "text-on-surface/40" },
};

const heatmapColor = (pct: number) => {
  const stops = [
    { at: 0.0, rgb: [59, 130, 246] }, // blue
    { at: 0.3, rgb: [59, 130, 246] }, // blue
    { at: 0.6, rgb: [245, 158, 11] }, // amber
    { at: 1.0, rgb: [239, 68, 68] },  // red
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (pct >= stops[i].at && pct <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi.at - lo.at || 1;
  const t = (pct - lo.at) / span;
  const rgb = lo.rgb.map((c, i) => Math.round(c + (hi.rgb[i] - c) * t));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.15 + pct * 0.65})`;
};

export const LiveMonitor: React.FC = () => {
  const { url, setUrl, status, lastMessage, msgCount, latency, sessionStartTime, connect, disconnect } = useWebSocket('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (sessionStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime('00:00:00');
    }
  }, [sessionStartTime]);

  useEffect(() => {
    if (lastMessage?.alert_sent) {
      const newAlert = {
        posture: lastMessage.posture,
        time: new Date().toLocaleTimeString(),
        id: Date.now(),
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 20));
    }
  }, [lastMessage]);

  const sensors = lastMessage?.sensors || {};
  const fsrKeys = [
    { slot: "fl", key: "fsr_front_left", label: "FL" },
    { slot: "fm", key: "fsr_front_mid", label: "FM" },
    { slot: "fr", key: "fsr_front_right", label: "FR" },
    { slot: "ml", key: "fsr_mid_left", label: "ML" },
    { slot: "mm", key: "fsr_mid_mid", label: "MC" },
    { slot: "mr", key: "fsr_mid_right", label: "MR" },
    { slot: "bl", key: "fsr_back_left", label: "BL" },
    { slot: "bm", key: "fsr_back_mid", label: "BM" },
    { slot: "br", key: "fsr_back_right", label: "BR" },
  ];

  const meta = POSTURE_META[lastMessage?.posture || 'unknown'] || POSTURE_META.unknown;

  return (
    <div className="px-6 md:px-12 lg:pr-32 lg:pl-20 pb-24 space-y-8">
      {/* Connection Card */}
      <section className="bg-white border border-outline-variant/15 rounded-[2rem] p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[300px]">
            <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Fog Node WebSocket URL</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'connected'}
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
              placeholder="ws://localhost:8765"
            />
          </div>
          <button 
            onClick={status === 'connected' ? disconnect : connect}
            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
              status === 'connected' ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {status === 'connected' ? 'Disconnect' : 'Connect'}
          </button>
          <div className="flex items-center gap-4 border-l border-outline-variant/15 pl-6">
            <div className="flex items-center gap-2">
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                status === 'connected' ? 'bg-tertiary-fixed-dim animate-pulse' : 
                status === 'connecting' ? 'bg-secondary-fixed-dim' : 
                status === 'error' ? 'bg-error' : 'bg-outline'
              }`}></span>
              <span className="text-xs font-bold text-on-surface/60 uppercase">{status}</span>
            </div>
            {status === 'connected' && (
              <div className="flex gap-4 text-[10px] font-bold text-on-surface/40 uppercase">
                <span>{latency} ms</span>
                <span>{msgCount} msgs</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Status */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-10 shadow-sm">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-2">Current Posture</p>
                <div className={`text-[48px] font-black ${meta.color} leading-none flex items-center gap-4`}>
                  <span className="material-symbols-outlined !text-5xl">{meta.icon}</span>
                  {meta.label}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-2">Session Time</p>
                <p className="text-3xl font-black font-mono">{elapsedTime}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Pressure Grid */}
              <div className="space-y-6">
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest text-center">Pressure Distribution</p>
                <div className="grid grid-cols-3 gap-3 aspect-square max-w-[300px] mx-auto">
                  {fsrKeys.map(({ slot, key, label }) => {
                    const val = (sensors as any)[key] || 0;
                    const pct = val / 4095;
                    return (
                      <div 
                        key={slot}
                        style={{ backgroundColor: heatmapColor(pct) }}
                        className="rounded-2xl flex flex-col items-center justify-center border border-outline-variant/5 transition-colors duration-200"
                      >
                        <span className="text-[10px] font-black text-on-surface/40">{label}</span>
                        <span className="text-sm font-bold font-mono">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Other Sensors */}
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-4">Confidence</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-surface-container-low rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.round((lastMessage?.confidence || 0) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-black font-mono w-12">{Math.round((lastMessage?.confidence || 0) * 100)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-on-surface/40 uppercase mb-1">Temperature</p>
                    <p className="text-2xl font-black font-mono">{sensors.temperature ? sensors.temperature.toFixed(1) : '--'}°C</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-on-surface/40 uppercase mb-1">Presence</p>
                    <p className="text-2xl font-black">{lastMessage?.person_detected ? 'YES' : 'NO'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Alert History */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-8 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black tracking-tight">Recent Alerts</h3>
              {alerts.length > 0 && (
                <span className="text-[10px] font-bold text-error px-2 py-1 bg-error/10 rounded-full">ACTIVE</span>
              )}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2">
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface/20 py-12">
                  <span className="material-symbols-outlined !text-6xl mb-4">notifications_off</span>
                  <p className="text-sm font-bold uppercase tracking-widest">No alerts recorded</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="flex gap-4 items-start p-4 bg-surface-container-low rounded-2xl">
                    <div className="h-8 w-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-sm text-error">notification_important</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{POSTURE_META[alert.posture]?.label || alert.posture}</p>
                      <p className="text-xs text-on-surface/40 mt-1 font-mono">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
