import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket, type PostureLabel } from '../hooks/useWebSocket';


// ---------------------------------------------------------------------------
// Posture metadata
// ---------------------------------------------------------------------------
const POSTURE_LABELS: Record<PostureLabel, string> = {
  NUP:    'Natural Upright',
  LF:     'Leaning Forward',
  LB:     'Leaning Backward',
  LFSR:   'Lean Fwd – Right',
  LFSL:   'Lean Fwd – Left',
  CRL:    'Cross-Leg (Right)',
  CLL:    'Cross-Leg (Left)',
  CRLL:   'Cross-Leg Deep (Right)',
  CLLL:   'Cross-Leg Deep (Left)',
  EMPTY:  'No Person',
  OBJECT: 'Object Detected',
};

interface Sensors { FL: number; FM: number; FR: number; ML: number; MM: number; MR: number; BL: number; BM: number; BR: number; }
const ZERO_SENSORS: Sensors = { FL:0, FM:0, FR:0, ML:0, MM:0, MR:0, BL:0, BM:0, BR:0 };

const fmt = (secs: number) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const cellClass = (val: number, occupied: boolean) => {
  if (!occupied) return 'bg-capy-bg text-capy-muted/60';
  if (val < 20) return 'bg-capy-card text-capy-muted';
  if (val < 60) return 'bg-capy-amber-soft text-capy-brown-3';
  return 'bg-capy-danger/25 text-capy-danger font-bold';
};


import { TransparentImage } from '../components/TransparentImage';

export const LiveMonitor: React.FC = () => {
  const ws = useWebSocket();
  const msg = ws.lastMessage;

  // ---- Real data from fog ----
  const occupied = msg?.occupancy_state === 'occupied';
  const sensors: Sensors = msg?.sensors_heatmap_pct?.length === 9
    ? {
        FL: msg.sensors_heatmap_pct[0], FM: msg.sensors_heatmap_pct[1], FR: msg.sensors_heatmap_pct[2],
        ML: msg.sensors_heatmap_pct[3], MM: msg.sensors_heatmap_pct[4], MR: msg.sensors_heatmap_pct[5],
        BL: msg.sensors_heatmap_pct[6], BM: msg.sensors_heatmap_pct[7], BR: msg.sensors_heatmap_pct[8],
      }
    : ZERO_SENSORS;


  const sessionDuration = msg?.session_duration_sec ?? 0;
  const poorDuration    = msg?.poor_posture_duration_sec ?? 0;
  const goodDuration    = sessionDuration - poorDuration;

  // ---- Good Posture Gem Calculation (1 Gem every 10 seconds of GOOD posture) ----
  const currentSessionGems = useMemo(() => {
    if (!occupied) return 0;
    return Math.floor(goodDuration / 10);
  }, [occupied, goodDuration]);

  const goodPct         = msg ? Math.round(msg.good_posture_pct) : 0;
  const alertCount      = msg?.alert_count ?? 0;
  const posture: PostureLabel = msg?.posture ?? 'EMPTY';

  // ---- Visual mapping for the capybara cushion (Driven by AI Posture Labels) ----
  const view = useMemo(() => {
    switch (posture) {
      case 'NUP':
        return {
          tint: 'from-emerald-500/15 to-emerald-500/25',
          alertTitle: <>Natural Upright Posture <span className="text-emerald-500">✦</span></>,
          aiMessage: "Perfect posture! Keep it up.",
          mood: 'good' as const,
        };
      case 'LF':
        return {
          tint: 'from-amber-500/15 to-amber-500/25',
          alertTitle: <>Lean Forward <span className="text-amber-500">⚠</span></>,
          aiMessage: "Try to sit back and align your spine.",
          mood: 'bad' as const,
        };
      case 'LB':
        return {
          tint: 'from-amber-500/15 to-amber-500/25',
          alertTitle: <>Lean Backward <span className="text-amber-500">⚠</span></>,
          aiMessage: "Shift slightly forward for better balance.",
          mood: 'bad' as const,
        };
      case 'LFSR':
        return {
          tint: 'from-orange-500/15 to-orange-500/25',
          alertTitle: <>Lean Forward Support Right <span className="text-orange-500">→</span></>,
          aiMessage: "You're leaning right. Center your weight.",
          mood: 'bad' as const,
        };
      case 'LFSL':
        return {
          tint: 'from-orange-500/15 to-orange-500/25',
          alertTitle: <>Lean Forward Support Left <span className="text-orange-500">←</span></>,
          aiMessage: "You're leaning left. Center your weight.",
          mood: 'bad' as const,
        };
      case 'CRL':
        return {
          tint: 'from-rose-500/15 to-rose-500/25',
          alertTitle: <>Cross-Right Legged <span className="text-rose-500">✘</span></>,
          aiMessage: "Uncross your legs for better blood flow.",
          mood: 'bad' as const,
        };
      case 'CLL':
        return {
          tint: 'from-rose-500/15 to-rose-500/25',
          alertTitle: <>Cross-Left Legged <span className="text-rose-500">✘</span></>,
          aiMessage: "Uncross your legs for better blood flow.",
          mood: 'bad' as const,
        };
      case 'CRLL':
        return {
          tint: 'from-red-600/15 to-red-600/25',
          alertTitle: <>Cross-Right Legged Deep <span className="text-red-600">⚠</span></>,
          aiMessage: "Avoid leaning while your legs are crossed.",
          mood: 'bad' as const,
        };
      case 'CLLL':
        return {
          tint: 'from-red-600/15 to-red-600/25',
          alertTitle: <>Cross-Left Legged Deep <span className="text-red-600">⚠</span></>,
          aiMessage: "Avoid leaning while your legs are crossed.",
          mood: 'bad' as const,
        };
      case 'EMPTY':
        return {
          tint: 'from-slate-100 to-slate-200',
          alertTitle: <>No One Seated</>,
          aiMessage: "Waiting for someone to sit down.",
          mood: 'neutral' as const,
        };
      case 'OBJECT':
        return {
          tint: 'from-slate-200 to-slate-300',
          alertTitle: <>Object Detected</>,
          aiMessage: "Please remove objects from the cushion.",
          mood: 'neutral' as const,
        };
      default:
        return {
          tint: 'from-slate-50 to-slate-100',
          alertTitle: <>IDLE</>,
          aiMessage: "Waiting for Fog Node...",
          mood: 'good' as const,
        };
    }
  }, [posture]);

  return (
    <div className="mx-auto max-w-6xl text-capy-text px-4 md:px-8 py-6 md:py-8 space-y-6">

      <div className="grid grid-cols-12 gap-4 md:gap-6">

        {/* LEFT: Sensors & Alert Status */}
        <div className="col-span-12 flex flex-col gap-4 md:gap-6 lg:col-span-5 order-2 lg:order-1">

          <div className="rounded-3xl bg-capy-card p-5 md:p-6 shadow-sm border border-capy-border">
            <div className="mb-6 flex justify-between items-start gap-4">
              <div className="min-w-[240px]">
                <p className="text-xs font-bold uppercase tracking-wider text-capy-muted mb-1">Active Session</p>
                <h2 className="text-2xl font-black tracking-tight leading-tight">{occupied ? 'Person Detected' : 'No Person'}</h2>
                <p className="mt-1 text-xs font-medium text-capy-muted/80">{POSTURE_LABELS[posture]}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold uppercase tracking-wider text-capy-muted mb-1">Duration</p>
                <p className="text-xl font-mono font-bold text-capy-brown tracking-wider">{fmt(sessionDuration)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-capy-bg p-4 border border-capy-border/60">
              <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-capy-muted">
                Pressure Map · Top-Down
              </p>
              <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2">
                {(['FL','FM','FR','ML','MM','MR','BL','BM','BR'] as (keyof Sensors)[]).map(k => {
                  const val = sensors[k];
                  return (
                    <div key={k} className={`flex aspect-square flex-col items-center justify-center rounded-xl transition-colors duration-300 border border-capy-border/40 ${cellClass(val, occupied)}`}>
                      <span className="text-[10px] font-bold opacity-70 tracking-widest">{k}</span>
                      <span className="text-lg font-mono font-bold">{occupied ? Math.round(val) : 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-capy-card p-6 shadow-sm border border-capy-border">
            <h3 className="mb-4 text-lg font-black tracking-tight">Alert Status</h3>
            <div className="grid grid-cols-2 gap-y-6 text-center">
              <div>
                <p className="text-2xl font-mono font-bold text-capy-text">{fmt(sessionDuration)}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-capy-muted">Total</p>
              </div>
              <div>
                <p className={`text-2xl font-mono font-bold ${goodPct >= 80 ? 'text-capy-success' : goodPct >= 50 ? 'text-capy-warn' : 'text-capy-danger'}`}>{fmt(poorDuration)}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-capy-muted">Poor</p>
              </div>
              <div>
                <p className={`text-2xl font-bold font-mono ${alertCount === 0 ? 'text-capy-success' : 'text-capy-danger'}`}>{alertCount}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-capy-muted">Alerts</p>
              </div>
              <div>
                <p className={`text-2xl font-bold font-mono ${goodPct >= 80 ? 'text-capy-success' : goodPct >= 50 ? 'text-capy-warn' : 'text-capy-danger'}`}>{goodPct}%</p>
                <p className="text-xs font-bold uppercase tracking-wider text-capy-muted">
                  {goodPct >= 80 ? 'Keep It Up' : goodPct >= 50 ? 'Improving' : 'Needs Work'}
                </p>
              </div>
            </div>

            {/* --- Session Gems Stats --- */}
            <div className="mt-4 pt-4 md:mt-6 md:pt-6 border-t border-capy-border flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-capy-muted mb-1">Session Gems</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">💎</span>
                  <span className="text-xl md:text-2xl font-black text-capy-brown-3">{currentSessionGems}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] font-bold text-capy-muted leading-tight">
                  1 Gem every 10s<br/>of Proper Sitting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Capybara coach */}
        <div className="col-span-12 flex flex-col lg:col-span-7 order-1 lg:order-2">
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-capy-card p-6 md:p-8 shadow-sm border border-capy-border overflow-hidden relative min-h-[500px] md:min-h-[640px]">

            <div className="absolute top-6 w-full px-8 flex justify-center lg:justify-between">
              <h3 className="text-lg font-black tracking-tight">Current Posture</h3>
            </div>

            {/* Organic wavy cushion background — color reacts to posture */}
            <div
              className={`relative mt-12 flex h-72 w-72 items-center justify-center bg-gradient-to-br transition-colors duration-700 shadow-[inset_0_0_40px_rgba(255,255,255,0.3)] ${view.tint}`}
              style={{ borderRadius: '43% 57% 65% 35% / 45% 45% 55% 55%' }}
            >
              <div className="relative w-64 h-64 flex items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={posture}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="z-10 w-full h-full flex items-center justify-center"
                  >
                    <TransparentImage
                      src={
                        posture === 'NUP'  ? '/assets/capybara/postures/nup.png' :
                        posture === 'LF'   ? '/assets/capybara/postures/lf.png' :
                        posture === 'LB'   ? '/assets/capybara/postures/lb.png' :
                        posture === 'LFSR' ? '/assets/capybara/postures/lfsr.png' :
                        posture === 'LFSL' ? '/assets/capybara/postures/lfsl.png' :
                        posture === 'CRL'  ? '/assets/capybara/postures/crl.png' :
                        posture === 'CLL'  ? '/assets/capybara/postures/cll.png' :
                        posture === 'CRLL' ? '/assets/capybara/postures/crll.png' : 
                        posture === 'CLLL' ? '/assets/capybara/postures/clll.png' : 
                        '/assets/capybara/logo.png'
                      }
                      alt="Capybara Coach"
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>


            <h2 className="mt-8 text-center text-3xl font-black tracking-tight transition-all duration-300 px-4 min-h-[40px]">
              {view.alertTitle}
            </h2>

            {/* Fixed height container for AI Message and Button to prevent layout shifting */}
            <div className="mt-6 flex flex-col items-center min-h-[140px]">
              <div className="flex max-w-md items-start gap-3 px-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-capy-amber-soft border border-capy-border text-xl shadow-sm">
                  🦫
                </div>
                <div className={`relative rounded-2xl rounded-tl-none px-5 py-4 text-sm font-medium shadow-sm border transition-all duration-300 ${
                  view.mood === 'good'
                    ? 'bg-capy-success/10 text-capy-success border-capy-success/40'
                    : view.mood === 'bad'
                    ? 'bg-capy-danger/10 text-capy-danger border-capy-danger/30'
                    : 'bg-capy-amber-soft text-capy-brown-3 border-capy-border'
                }`}>
                  {view.aiMessage}
                </div>
              </div>

              {/* Reserve space for button so it doesn't push the layout when it appears */}
              <div className="h-20 flex items-center justify-center">
                <AnimatePresence>
                  {view.mood === 'bad' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-xl bg-capy-danger hover:opacity-90 px-8 py-3 font-bold text-white shadow-md transition-all active:scale-95"
                    >
                      Got it, I'll adjust!
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
