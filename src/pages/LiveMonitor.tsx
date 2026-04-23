import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { cn } from '../lib/utils';

const POSTURE_META: Record<string, any> = {
  correct: { label: "Good", icon: "check_circle", color: "text-primary", border: "border-primary" },
  lean_left: { label: "Leaning Left", icon: "arrow_back", color: "text-secondary", border: "border-secondary" },
  lean_right: { label: "Leaning Right", icon: "arrow_forward", color: "text-secondary", border: "border-secondary" },
  slouch_forward: { label: "Slouching", icon: "arrow_downward", color: "text-error", border: "border-error" },
  lean_back: { label: "Leaning Back", icon: "arrow_upward", color: "text-secondary", border: "border-secondary" },
  unknown: { label: "No Person", icon: "help", color: "text-on-surface/40", border: "border-outline-variant/10" },
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
    { slot: "fl", key: "fsr_front_left", label: "FL", isGauge: true },
    { slot: "fm", key: "fsr_front_mid", label: "FM", isGauge: false },
    { slot: "fr", key: "fsr_front_right", label: "FR", isGauge: true },
    { slot: "ml", key: "fsr_mid_left", label: "ML", isGauge: false },
    { slot: "mm", key: "fsr_mid_mid", label: "MM", isGauge: false },
    { slot: "mr", key: "fsr_mid_right", label: "MR", isGauge: false },
    { slot: "bl", key: "fsr_back_left", label: "BL", isGauge: true },
    { slot: "bm", key: "fsr_back_mid", label: "BM", isGauge: false },
    { slot: "br", key: "fsr_back_right", label: "BR", isGauge: true },
  ];

  const meta = POSTURE_META[lastMessage?.posture || 'unknown'] || POSTURE_META.unknown;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Connectivity Banner */}
      <div className="bg-primary px-8 py-3 flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex h-3 w-3">
            <span className={cn("relative inline-flex rounded-full h-3 w-3", 
              status === 'connected' ? 'bg-tertiary-fixed-dim animate-pulse' : 
              status === 'connecting' ? 'bg-secondary-fixed-dim' : 
              status === 'error' ? 'bg-error' : 'bg-outline'
            )}></span>
          </div>
          <span className="font-medium tracking-tight text-white/80">
            {status === 'connected' ? 'Real-time mode — Connected' : 
             status === 'connecting' ? `Connecting to ${url}...` : 
             status === 'error' ? 'Connection error — check device URL' : 'Real-time mode — Waiting for Device...'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono">
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === 'connected'}
            className="px-3 py-1 rounded-lg text-xs bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 w-56"
            placeholder="ws://host:port"
          />
          <span className="opacity-80">Latency: {latency} ms</span>
          <span className="opacity-80">Msgs: {msgCount}</span>
          <button 
            onClick={status === 'connected' ? disconnect : connect}
            className="ml-2 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/25 border border-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">power_settings_new</span>
            <span>{status === 'connected' ? 'Disconnect' : 'Connect'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Three-Column Layout */}
      <div className="p-8 grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Primary Posture Feedback */}
        <section className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-on-surface/40 mb-1">Current State</p>
                <h1 className={cn("text-[48px] font-black leading-none flex items-center gap-2", meta.color)}>
                  <span>{meta.label}</span> 
                  <span className="material-symbols-outlined text-4xl">{meta.icon}</span>
                </h1>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest font-bold text-on-surface/40 mb-1">Time Active</p>
                <p className="font-mono text-2xl font-bold text-on-surface">{elapsedTime}</p>
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Confidence Score</span>
                <span className="text-primary">{Math.round((lastMessage?.confidence || 0) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${Math.round((lastMessage?.confidence || 0) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Cushion Diagram */}
            <div className="relative bg-surface-container-low rounded-2xl p-6 mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface/40 text-center mb-6">Pressure Map (FSR)</p>
              <div className="grid grid-cols-3 gap-2 aspect-square max-w-[260px] mx-auto">
                {fsrKeys.map(({ slot, key, label }) => {
                  const val = (sensors as any)[key] || 0;
                  const pct = val / 4095;
                  return (
                    <div 
                      key={slot}
                      style={{ backgroundColor: heatmapColor(pct) }}
                      className="rounded-lg flex flex-col items-center justify-center border-b-2 border-primary/20 shadow-sm transition-colors py-2"
                    >
                      <span className="text-[9px] font-bold text-on-surface/40">{label}</span>
                      <span className="font-mono text-sm font-black text-on-surface">{val || '--'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex justify-between gap-2">
              <div className="flex-1 bg-surface-container-low py-3 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-1">thermostat</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/60">Temp</span>
                <span className="font-mono text-sm font-bold">{sensors.temperature ? sensors.temperature.toFixed(1) : '--'}°C</span>
              </div>
              <div className="flex-1 bg-surface-container-low py-3 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-1">person</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/60">Person</span>
                <span className="font-mono text-sm font-bold">{lastMessage?.person_detected ? 'YES' : 'NO'}</span>
              </div>
              <div className="flex-1 bg-surface-container-low py-3 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-1">settings_input_component</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/60">Motor</span>
                <span className={cn("font-mono text-sm font-bold", lastMessage?.alert_sent ? "text-error" : "")}>
                  {lastMessage?.alert_sent ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Column: Sensor Readings & Detailed Analytics */}
        <section className="col-span-12 lg:col-span-5 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)]">
            <h3 className="text-xl font-black mb-8">Sensor readings</h3>
            <div className="grid grid-cols-2 gap-8 mb-12">
              {fsrKeys.filter(k => k.isGauge).map(({ slot, key, label }) => {
                const val = (sensors as any)[key] || 0;
                const pct = Math.round((val / 4095) * 100);
                return (
                  <div key={slot} className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface/40">
                      <span>{label}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-surface-container-low">
                        <div 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-300" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-surface p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">data_object</span>
                </div>
                <div>
                  <h4 className="font-bold">WebSocket Status</h4>
                  <p className="text-xs text-on-surface/40 tracking-tight">Active stream: raw_pressure_events</p>
                </div>
              </div>
              <pre className="font-mono text-[11px] bg-on-surface text-white p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'Waiting for data…'}
              </pre>
            </div>
          </div>
        </section>

        {/* Right Column: Alerts & Quick Tips */}
        <section className="col-span-12 lg:col-span-3 space-y-8">
          <div className={cn("bg-white p-6 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)] border-l-4", 
            alerts.length > 0 ? "border-error" : "border-on-surface/40")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-widest font-black">Alerts</h3>
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", 
                alerts.length > 0 ? "text-error bg-error/10" : "text-on-surface/40 bg-surface-container-low")}>
                {alerts.length > 0 ? "ACTIVE" : "Waiting for Data"}
              </span>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="flex gap-4 items-start opacity-60">
                  <div className="mt-1 h-6 w-6 rounded-full bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">No alerts yet</p>
                    <p className="text-xs text-on-surface/40 mt-1 leading-relaxed">Connect to a Device to start receiving posture alerts.</p>
                  </div>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="flex gap-4 items-start">
                    <div className="mt-1 h-6 w-6 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-xs text-error">notification_important</span>
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
          
          <div className="p-6 rounded-3xl bg-on-surface/5 backdrop-blur-xl border-l-4 border-on-surface/40">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-on-surface/60">psychology</span>
              <h3 className="text-sm font-black text-on-surface/60 uppercase tracking-widest">Quick tip</h3>
            </div>
            <p className="text-sm text-on-surface/60 leading-relaxed">
              Waiting for session data to generate AI insights and recommendations.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
