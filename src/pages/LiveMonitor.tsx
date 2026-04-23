import React, { useState, useEffect } from 'react';
import { useWebSocket, type PostureLabel, type OccupancyState } from '../hooks/useWebSocket';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Posture metadata — 9 labels per system_architecture.md §1
// ---------------------------------------------------------------------------
const POSTURE_META: Record<PostureLabel, { label: string; icon: string; color: string; isGood: boolean }> = {
  NUP:     { label: 'Natural Upright',         icon: 'check_circle',    color: 'text-emerald-500', isGood: true  },
  LF:      { label: 'Lean Forward',            icon: 'arrow_downward',  color: 'text-amber-500',   isGood: false },
  LB:      { label: 'Lean Backward',           icon: 'arrow_upward',    color: 'text-amber-500',   isGood: false },
  LFSR:    { label: 'Lean Fwd – Right Arm',    icon: 'arrow_forward',   color: 'text-orange-500',  isGood: false },
  LFSL:    { label: 'Lean Fwd – Left Arm',     icon: 'arrow_back',      color: 'text-orange-500',  isGood: false },
  CRL:     { label: 'Cross-Leg (Right)',        icon: 'swap_vert',       color: 'text-rose-500',    isGood: false },
  CLL:     { label: 'Cross-Leg (Left)',         icon: 'swap_vert',       color: 'text-rose-500',    isGood: false },
  CRLL:    { label: 'Cross-Leg Deep (Right)',   icon: 'priority_high',   color: 'text-red-600',     isGood: false },
  CLLL:    { label: 'Cross-Leg Deep (Left)',    icon: 'priority_high',   color: 'text-red-600',     isGood: false },
  EMPTY:   { label: 'No Person',               icon: 'person_off',      color: 'text-slate-400',   isGood: false },
  OBJECT:  { label: 'Object Detected',         icon: 'category',        color: 'text-amber-600',   isGood: false },
};

// FSR heatmap cells in row-major order: FL FM FR / ML MM MR / BL BM BR
const HEATMAP_CELLS = [
  { label: 'FL', title: 'Front Left' },
  { label: 'FM', title: 'Front Mid'  },
  { label: 'FR', title: 'Front Right'},
  { label: 'ML', title: 'Mid Left'   },
  { label: 'MM', title: 'Center'     },
  { label: 'MR', title: 'Mid Right'  },
  { label: 'BL', title: 'Back Left'  },
  { label: 'BM', title: 'Back Mid'   },
  { label: 'BR', title: 'Back Right' },
];

// Heatmap colour: blue → amber → red
const heatmapColor = (pct: number) => {
  const p = pct / 100;
  const stops = [
    { at: 0.0, rgb: [59,  130, 246] },
    { at: 0.3, rgb: [59,  130, 246] },
    { at: 0.6, rgb: [245, 158,  11] },
    { at: 1.0, rgb: [239,  68,  68] },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].at && p <= stops[i + 1].at) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const span = hi.at - lo.at || 1;
  const t    = (p - lo.at) / span;
  const rgb  = lo.rgb.map((c, i) => Math.round(c + (hi.rgb[i] - c) * t));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.15 + p * 0.65})`;
};

const formatDuration = (secs: number) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const OCCUPANCY_BADGE: Record<OccupancyState, { label: string; color: string }> = {
  occupied:  { label: 'Occupied',  color: 'bg-emerald-100 text-emerald-700' },
  empty:     { label: 'Empty',     color: 'bg-slate-100 text-slate-500'     },
  uncertain: { label: 'Uncertain', color: 'bg-amber-100 text-amber-700'     },
};

const ALERT_STATUS_COLOR: Record<string, string> = {
  IDLE:     'bg-slate-100 text-slate-500',
  WARNING:  'bg-red-100 text-red-700',
  COOLDOWN: 'bg-amber-100 text-amber-700',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const LiveMonitor: React.FC = () => {
  const { url, setUrl, status, lastMessage, msgCount, latency, error, connect, disconnect } = useWebSocket();

  const [alertLog, setAlertLog] = useState<{ posture: string; time: string; id: number }[]>([]);

  // Accumulate alerts when WARNING fires
  useEffect(() => {
    if (lastMessage?.alert_status === 'WARNING' && lastMessage?.alert_active) {
      setAlertLog(prev => [
        { posture: lastMessage.posture, time: new Date().toLocaleTimeString(), id: Date.now() },
        ...prev,
      ].slice(0, 30));
    }
  }, [lastMessage?.alert_count]); // trigger on count change, not every message

  const heatmap  = lastMessage?.sensors_heatmap_pct ?? Array(9).fill(0);
  const posture  = lastMessage?.posture ?? 'EMPTY';
  const meta     = POSTURE_META[posture] ?? POSTURE_META.EMPTY;
  const occupancy = lastMessage?.occupancy_state ?? 'empty';
  const occupancyBadge = OCCUPANCY_BADGE[occupancy];
  const alertStatus = lastMessage?.alert_status ?? 'IDLE';

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">

      {/* ── Connectivity Banner ─────────────────────────────────────────── */}
      <div className="bg-primary px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className={cn(
            'inline-flex h-2.5 w-2.5 rounded-full',
            status === 'connected'  ? 'bg-emerald-400 animate-pulse' :
            status === 'connecting' ? 'bg-amber-400 animate-pulse'   :
            status === 'error'      ? 'bg-red-400'                    : 'bg-white/30'
          )} />
          <span className="text-sm font-medium text-white/90">
            {status === 'connected'  ? `Connected — ${url}` :
             status === 'connecting' ? `Connecting to ${url}…` :
             status === 'error'      ? (error ?? 'Connection error') : 'Real-time Monitor — Not connected'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm font-mono">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={status === 'connected' || status === 'connecting'}
            className="px-3 py-1 rounded-lg text-xs bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 w-60"
            placeholder="ws://192.168.x.x:8765"
            id="fog-ws-url"
          />
          <span className="opacity-70 hidden sm:inline">Latency: {latency} ms</span>
          <span className="opacity-70 hidden sm:inline">Msgs: {msgCount}</span>
          <button
            id="btn-toggle-connection"
            onClick={status === 'connected' ? disconnect : connect}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/25 border border-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">power_settings_new</span>
            <span>{status === 'connected' ? 'Disconnect' : 'Connect'}</span>
          </button>
        </div>
      </div>

      {/* ── Main 3-column layout ────────────────────────────────────────── */}
      <div className="p-6 grid grid-cols-12 gap-6 items-start">

        {/* ── Left: Posture + Heatmap ─────────────────────────────────── */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)]">

            {/* Posture label */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40 mb-1">Current Posture</p>
                <h1 className={cn('text-4xl font-black leading-none flex items-center gap-2', meta.color)}>
                  <span>{meta.label}</span>
                  <span className="material-symbols-outlined text-3xl">{meta.icon}</span>
                </h1>
                <p className="text-xs font-mono text-on-surface/40 mt-1">{posture}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40">Session</p>
                <p className="font-mono text-xl font-bold text-on-surface">
                  {formatDuration(lastMessage?.session_duration_sec ?? 0)}
                </p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', occupancyBadge.color)}>
                  {occupancyBadge.label}
                </span>
              </div>
            </div>

            {/* FSR Heatmap — 3×3 grid */}
            <div className="bg-surface-container-low rounded-2xl p-5 mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface/40 text-center mb-4">
                Pressure Map · 9 FSR (%)
              </p>
              <div className="grid grid-cols-3 gap-2 aspect-square max-w-[240px] mx-auto">
                {HEATMAP_CELLS.map((cell, idx) => {
                  const pct = heatmap[idx] ?? 0;
                  return (
                    <div
                      key={cell.label}
                      title={`${cell.title}: ${pct.toFixed(1)}%`}
                      style={{ backgroundColor: heatmapColor(pct) }}
                      className="rounded-xl flex flex-col items-center justify-center border border-primary/10 shadow-sm transition-colors py-2 cursor-default"
                    >
                      <span className="text-[9px] font-bold text-on-surface/40">{cell.label}</span>
                      <span className="font-mono text-sm font-black text-on-surface">{pct.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status row */}
            <div className="flex justify-between gap-2">
              <div className="flex-1 bg-surface-container-low py-3 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-1">thermostat</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/60">Temp</span>
                <span className="font-mono text-sm font-bold">
                  {lastMessage ? lastMessage.temperature.toFixed(1) : '--'}°C
                </span>
              </div>
              <div className="flex-1 bg-surface-container-low py-3 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-1">vibration</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/60">Motor</span>
                <span className={cn('font-mono text-sm font-bold', lastMessage?.alert_active ? 'text-red-500' : '')}>
                  {lastMessage?.alert_active ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex-1 bg-surface-container-low py-3 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-1">notifications</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/60">Alerts</span>
                <span className="font-mono text-sm font-bold">{lastMessage?.alert_count ?? 0}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Middle: Analytics + Raw data ──────────────────────────────── */}
        <section className="col-span-12 lg:col-span-5 space-y-6">
          {/* Alert status card */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black">Alert Status</h3>
              <span className={cn('text-xs font-bold px-2 py-1 rounded-full', ALERT_STATUS_COLOR[alertStatus] ?? 'bg-slate-100 text-slate-500')}>
                {alertStatus}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-2xl font-black text-on-surface">{lastMessage?.alert_count ?? 0}</p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface/40 mt-1">Total Alerts</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-2xl font-black text-on-surface">
                  {formatDuration(lastMessage?.session_duration_sec ?? 0)}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface/40 mt-1">Duration</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-2xl font-black text-on-surface">
                  {lastMessage?.temperature.toFixed(1) ?? '--'}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface/40 mt-1">Temp °C</p>
              </div>
            </div>

            {/* Session info */}
            {lastMessage?.session_id && (
              <div className="mt-4 bg-surface-container-low rounded-xl p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Session Info</p>
                <p className="font-mono text-xs text-on-surface/70">ID: {lastMessage.session_id}</p>
                <p className="font-mono text-xs text-on-surface/70">
                  Started: {lastMessage.session_start_time_iso
                    ? new Date(lastMessage.session_start_time_iso).toLocaleTimeString()
                    : '—'}
                </p>
                <p className="font-mono text-xs text-on-surface/70">Device: {lastMessage.device_id}</p>
              </div>
            )}
          </div>

          {/* Raw WebSocket payload viewer */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">data_object</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Live Payload</h4>
                <p className="text-xs text-on-surface/40">WebSocket · Interface 02 · 0.5 s</p>
              </div>
            </div>
            <pre className="font-mono text-[10px] bg-on-surface text-white p-4 rounded-xl overflow-auto max-h-52 whitespace-pre-wrap leading-relaxed">
              {lastMessage ? JSON.stringify(lastMessage, null, 2) : '// Waiting for data from Fog Node…'}
            </pre>
          </div>
        </section>

        {/* ── Right: Alert log ──────────────────────────────────────────── */}
        <section className="col-span-12 lg:col-span-3 space-y-6">
          <div className={cn(
            'bg-white p-6 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)] border-l-4',
            alertLog.length > 0 ? 'border-red-400' : 'border-on-surface/10'
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-widest font-black">Alert Log</h3>
              <span className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-full',
                alertLog.length > 0 ? 'text-red-600 bg-red-50' : 'text-on-surface/40 bg-surface-container-low'
              )}>
                {alertLog.length > 0 ? `${alertLog.length} events` : 'No alerts'}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {alertLog.length === 0 ? (
                <div className="flex gap-3 items-start opacity-50">
                  <span className="material-symbols-outlined text-sm mt-0.5">hourglass_empty</span>
                  <div>
                    <p className="text-sm font-bold">No alerts yet</p>
                    <p className="text-xs text-on-surface/40 mt-0.5 leading-relaxed">
                      Connect to the Fog Node to start monitoring.
                    </p>
                  </div>
                </div>
              ) : (
                alertLog.map(alert => (
                  <div key={alert.id} className="flex gap-3 items-start">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[11px] text-red-600">notification_important</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {POSTURE_META[alert.posture as PostureLabel]?.label ?? alert.posture}
                      </p>
                      <p className="text-[11px] text-on-surface/40 font-mono">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tips card */}
          <div className="p-5 rounded-3xl bg-primary/5 border-l-4 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary/60 text-lg">psychology</span>
              <h3 className="text-xs font-black text-primary/60 uppercase tracking-widest">Quick Tip</h3>
            </div>
            <p className="text-xs text-on-surface/60 leading-relaxed">
              {lastMessage?.posture === 'NUP'
                ? '✅ Great posture! Keep your back straight and feet flat on the floor.'
                : lastMessage?.occupancy_state === 'occupied'
                  ? '⚠️ Adjust your posture — aim for a natural upright position (NUP).'
                  : 'Connect the Fog Node and sit on the cushion to start monitoring.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
