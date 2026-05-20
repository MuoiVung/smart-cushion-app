import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  fetchSummaries,
  fetchSessions,
  getApiConfig,
  secToHuman,
  todayIso,
  type DailySummary,
  type SessionsResponse,
} from '../lib/api';
import { useApiData } from '../hooks/useApiData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Posture score for a single DailySummary (good% = 1 - poor%). */
function dailyScore(s: DailySummary): number {
  if (s.total_sitting_duration_sec === 0) return 0;
  const goodSec = s.total_sitting_duration_sec - s.poor_posture_duration_sec;
  return Math.round((goodSec / s.total_sitting_duration_sec) * 100);
}

/** Derive score label + colour + emoji from a numeric score. */
function scoreMeta(score: number): { sub: string; color: string; emoji: string } {
  if (score >= 80) return { sub: 'KEEP IT UP', color: 'text-tertiary',  emoji: '🎉🦫' };
  if (score >= 50) return { sub: 'IMPROVING',  color: 'text-secondary', emoji: '📈'   };
  return               { sub: 'NEEDS WORK',  color: 'text-error',     emoji: '⚠️'   };
}

/** Weekly score from all summaries (divides by total sitting time). */
function weeklyScoreFromSummaries(summaries: DailySummary[]): number {
  let totalSec = 0;
  let poorSec = 0;
  for (const d of summaries) {
    totalSec += d.total_sitting_duration_sec;
    poorSec  += d.poor_posture_duration_sec;
  }
  if (totalSec === 0) return 0;
  return Math.round(((totalSec - poorSec) / totalSec) * 100);
}

/** Weekly score from sessions response. */
function weeklyScoreFromSessions(sessions: SessionsResponse): number {
  let totalSec = 0;
  let poorSec  = 0;
  for (const s of sessions.sessions) {
    totalSec += s.duration_sec;
    poorSec  += s.poor_posture_duration_sec;
  }
  if (totalSec === 0) return 0;
  return Math.round(((totalSec - poorSec) / totalSec) * 100);
}

// ─── Mock data factories (deterministic-ish, used only when no API URL set) ──

// ─── Component ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const ws = useWebSocket();
  const cfg   = useMemo(getApiConfig, []);
  const today = useMemo(todayIso, []);
  const from  = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon - 7); // Monday of last week
    return monday.toISOString().slice(0, 10);
  }, []);

  const summaries = useApiData<DailySummary[]>(
    () => fetchSummaries(cfg.deviceId, from, today),
    [cfg.deviceId, from, today],
  );
  const sessions = useApiData<SessionsResponse>(
    () => fetchSessions(cfg.deviceId, from, today),
    [cfg.deviceId, from, today],
  );

  const loading = summaries.loading || sessions.loading;
  const error   = summaries.error   || sessions.error; // summaries or sessions error

  const refresh = () => { summaries.refresh(); sessions.refresh(); };

  // ── Resolved data (real cloud data only) ──────────────────────────────────
  const activeSummaries: DailySummary[] = useMemo(() => {
    return summaries.data ?? [];
  }, [summaries.data]);

  const activeSessions: SessionsResponse = useMemo(() => {
    return sessions.data ?? {
      schema_version: '1.0',
      device_id: cfg.deviceId,
      total_count: 0,
      aggregates: { total_duration_sec: 0, total_poor_duration_sec: 0, total_alerts: 0 },
      sessions: []
    };
  }, [sessions.data, cfg.deviceId]);

  // Calculate dynamic Monday -> Sunday ISO dates for the current calendar week
  const currentWeekDates = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  // Calculate dynamic Monday -> Sunday ISO dates for the previous calendar week
  const lastWeekDates = useMemo(() => {
    return currentWeekDates.map(date => {
      const d = new Date(date);
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    });
  }, [currentWeekDates]);

  // Filter summaries and sessions specifically for the CURRENT week's metrics
  const currentWeekSummaries = useMemo(() => {
    return activeSummaries.filter(d => currentWeekDates.includes(d.date));
  }, [activeSummaries, currentWeekDates]);

  const currentWeekSessions = useMemo(() => {
    return {
      ...activeSessions,
      sessions: activeSessions.sessions.filter(s => {
        const sessionDate = s.start_time_iso.slice(0, 10);
        return currentWeekDates.includes(sessionDate);
      })
    };
  }, [activeSessions, currentWeekDates]);

  // ── Core stats (Scoped strictly to this week) ──────────────────────────────
  const weeklyScore = useMemo(() => {
    if (sessions.data) {
      const filtered = {
        ...sessions.data,
        sessions: sessions.data.sessions.filter(s => {
          const sessionDate = s.start_time_iso.slice(0, 10);
          return currentWeekDates.includes(sessionDate);
        })
      };
      return weeklyScoreFromSessions(filtered);
    }
    return weeklyScoreFromSummaries(currentWeekSummaries);
  }, [currentWeekSummaries, sessions.data, currentWeekDates]);

  const { sub, color, emoji } = scoreMeta(weeklyScore);

  const totalSittingSec = useMemo(
    () => currentWeekSummaries.reduce((s, d) => s + d.total_sitting_duration_sec, 0),
    [currentWeekSummaries],
  );
  const totalPoorSec = useMemo(
    () => currentWeekSummaries.reduce((s, d) => s + d.poor_posture_duration_sec, 0),
    [currentWeekSummaries],
  );
  const totalAlerts = useMemo(
    () => currentWeekSessions.sessions.reduce((s, x) => s + x.alert_count, 0),
    [currentWeekSessions],
  );

  // ── Weekly bar chart: this week vs last week ───────────────────────────────
  const thisWeekScores: number[] = useMemo(() => {
    const scoreMap = new Map<string, number>();
    for (const d of activeSummaries) scoreMap.set(d.date, dailyScore(d));
    const todayStr = todayIso();
    return currentWeekDates.map(date => {
      // If it's a future date, it should have 0 score (empty bar)
      if (date > todayStr) return 0;
      return scoreMap.get(date) ?? 0;
    });
  }, [activeSummaries, currentWeekDates]);

  // Last week: Dynamic values fetched directly from AWS Cloud summaries!
  const lastWeekScores: number[] = useMemo(() => {
    const scoreMap = new Map<string, number>();
    for (const d of activeSummaries) scoreMap.set(d.date, dailyScore(d));
    return lastWeekDates.map(date => {
      return scoreMap.get(date) ?? 0;
    });
  }, [activeSummaries, lastWeekDates]);

  // Standard weekday labels (MON, TUE...) synchronized with Insights page
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Calculate dynamic averages based only on elapsed days in the current week
  const thisWeekAvg = useMemo(() => {
    const todayStr = todayIso();
    let count = 0;
    let sum = 0;
    currentWeekDates.forEach((date, i) => {
      if (date <= todayStr) {
        sum += thisWeekScores[i];
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  }, [thisWeekScores, currentWeekDates]);

  const lastWeekAvg = useMemo(() => {
    // If no sit time was recorded last week, fallback to a healthy 0 or normal average
    const nonZeroScores = lastWeekScores.filter(s => s > 0);
    if (nonZeroScores.length === 0) return 0;
    return lastWeekScores.reduce((a, b) => a + b, 0) / 7;
  }, [lastWeekScores]);

  const scoreChange = thisWeekAvg - lastWeekAvg;

  const dynamicPhrase = useMemo(() => {
    if (scoreChange > 0)  return `Your posture score increased by ${scoreChange.toFixed(1)}% this week compared to last week. Keep it up!`;
    if (scoreChange === 0) return `Your posture score stayed the same as last week. Stay consistent!`;
    return `Your posture score dropped by ${Math.abs(scoreChange).toFixed(1)}% this week compared to last week. Let's get back on track!`;
  }, [scoreChange]);

  // ── AI Advisor ─────────────────────────────────────────────────────────────
  const advisorMessage = useMemo(() => {
    if (weeklyScore >= 80) return `"Great week! Your posture score of ${weeklyScore}% shows solid discipline. Keep maintaining that upright position and consider setting hourly reminders to check in."`;
    if (weeklyScore >= 50) return `"You're improving — ${weeklyScore}% this week. Try to focus on keeping your screen at eye level. Even 10 minutes of stretching per day can raise your score significantly."`;
    return `"This week was tough at ${weeklyScore}%. Don't worry — start small. Try sitting upright for just 15 minutes at a time and gradually extend. Your cushion will guide you!"`;
  }, [weeklyScore]);

  const stats = [
    { label: 'Total Sitting Time', value: secToHuman(totalSittingSec),  sub: 'THIS WEEK', color: 'text-on-surface' },
    { label: 'Poor Posture Time',  value: secToHuman(totalPoorSec),     sub: '',          color },
    { label: 'Alert Count',        value: String(totalAlerts),           sub: '',          color: totalAlerts > 0 ? 'text-error' : 'text-[#10b981]' },
    { label: 'Posture Score',      value: `${weeklyScore}%`,            sub,              color, emoji },
  ];

  // ── Real-Time Status Synchronization ───────────────────────────────────────
  const isWsConnected = ws.status === 'connected';
  const lastMsg = ws.lastMessage;
  const currentPosture = lastMsg?.posture ?? 'EMPTY';

  const rtStatus = useMemo(() => {
    if (!isWsConnected) {
      return {
        title: 'Smart Cushion Offline',
        sub: 'Cushion is offline',
        icon: 'sensors_off',
        iconBg: 'bg-on-surface/10 text-on-surface/40',
        pulseBg: 'bg-on-surface/30',
      };
    }

    switch (currentPosture) {
      case 'EMPTY':
        return {
          title: 'No One Seated',
          sub: 'Cushion is ready',
          icon: 'check_circle',
          iconBg: 'bg-on-surface/10 text-on-surface/40',
          pulseBg: 'bg-on-surface/30',
        };
      case 'OBJECT':
        return {
          title: 'Object Detected',
          sub: 'Please clear the cushion',
          icon: 'warning',
          iconBg: 'bg-amber-500/10 text-amber-500',
          pulseBg: 'bg-amber-500',
        };
      case 'UPRIGHT':
        const uprightScore = lastMsg?.posture_accuracy_score 
          ? (lastMsg.posture_accuracy_score > 1 ? lastMsg.posture_accuracy_score : lastMsg.posture_accuracy_score * 100) 
          : 94.2;
        return {
          title: 'Sitting Upright',
          sub: `Confidence: ${uprightScore.toFixed(1)}%`,
          icon: 'check_circle',
          iconBg: 'bg-[#10b981]/10 text-[#10b981]',
          pulseBg: 'bg-[#10b981]',
        };
      case 'FORWARD':
      case 'BACKWARD':
      case 'RIGHT':
      case 'LEFT':
        const poorLabel = 
          currentPosture === 'FORWARD'  ? 'Leaning Forward' :
          currentPosture === 'BACKWARD' ? 'Leaning Backward' :
          currentPosture === 'RIGHT'    ? 'Leaning Right' : 'Leaning Left';
        const badScore = lastMsg?.posture_accuracy_score 
          ? (lastMsg.posture_accuracy_score > 1 ? lastMsg.posture_accuracy_score : lastMsg.posture_accuracy_score * 100) 
          : 88.5;
        return {
          title: poorLabel,
          sub: `Confidence: ${badScore.toFixed(1)}%`,
          icon: 'error',
          iconBg: 'bg-error/10 text-error',
          pulseBg: 'bg-error',
        };
      default:
        return {
          title: 'Unknown State',
          sub: 'No person detected',
          icon: 'help',
          iconBg: 'bg-on-surface/10 text-on-surface/40',
          pulseBg: 'bg-on-surface/30',
        };
    }
  }, [isWsConnected, currentPosture, lastMsg]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center w-full px-4 md:px-8 py-6 md:py-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-on-surface leading-none">My Coach</h1>
          <p className="text-lg md:text-xl font-medium tracking-tight text-on-surface/60 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-4 ml-auto md:ml-0 no-print">
          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-md shadow-black/5 disabled:opacity-40"
            title="Refresh data"
          >
            <span className={`material-symbols-outlined text-sm md:text-base ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <section className="px-4 md:px-8 pb-12">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <p className="text-xs text-error font-medium">Failed to load data from cloud. Please check your connection.</p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-outline-variant/5 transition-all hover:bg-surface-bright">
              <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mb-1 md:mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className={`text-2xl md:text-4xl font-black ${stat.color} tracking-tighter font-mono ${loading ? 'opacity-30 animate-pulse' : ''}`}>
                  {stat.value}
                </span>
                {stat.sub && (
                  <div className="flex items-center gap-1.5">
                    {(stat as any).emoji && <span className="text-xl md:text-2xl">{(stat as any).emoji}</span>}
                    <span className="hidden sm:inline-block text-[8px] md:text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full mb-1">{stat.sub}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Weekly bar chart */}
          <div className="lg:col-span-8 bg-surface-container-low p-6 md:p-10 rounded-[2rem] md:rounded-[3rem]">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 md:mb-12 gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">Weekly progression</h3>
                <p className="text-xs md:text-sm text-on-surface/40">Posture Score (%) vs previous week</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-[8px] md:text-[10px] font-bold text-on-surface/60 uppercase">This Week</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                  <span className="text-[8px] md:text-[10px] font-bold text-on-surface/60 uppercase">Last Week</span>
                </div>
              </div>
            </div>
            <div className="h-48 md:h-64 flex items-end justify-between px-1 md:px-4 gap-1">
              {dayLabels.map((day, i) => {
                const lwScore = lastWeekScores[i];
                const twScore = thisWeekScores[i];
                return (
                  <div key={i} className="flex flex-col items-center gap-2 md:gap-3 flex-1 group/day relative">
                    {/* Unified Floating Pill Badge */}
                    {(lwScore > 0 || twScore > 0) && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/day:opacity-100 transition-opacity duration-300 pointer-events-none z-10 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full shadow-md border border-outline-variant/30 text-[7px] md:text-[9px] flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                        {lwScore > 0 && <span className="text-on-surface/40 font-bold">{lwScore}%</span>}
                        {lwScore > 0 && twScore > 0 && <span className="text-outline-variant/40">|</span>}
                        {twScore > 0 && <span className="text-primary font-black">{twScore}%</span>}
                      </div>
                    )}

                    <div className="w-full max-w-[1.5rem] md:max-w-[3rem] flex items-end justify-center gap-0.5 md:gap-1.5 h-32 md:h-48 border-b border-outline-variant/20 relative">
                      
                      {/* Last Week Bar */}
                      <div className="relative flex flex-col items-center justify-end h-full">
                        <div 
                          className="bg-outline-variant/30 w-1.5 md:w-3 rounded-t-sm transition-all duration-500 cursor-help" 
                          style={{ height: `${lwScore}%` }}
                          title={`Last Week: ${lwScore}%`}
                        ></div>
                      </div>
                      
                      {/* This Week Bar */}
                      <div className="relative flex flex-col items-center justify-end h-full">
                        <div 
                          className="bg-primary w-2 md:w-4 rounded-t-sm shadow-lg shadow-primary/20 transition-all duration-500 cursor-help" 
                          style={{ height: `${twScore}%` }}
                          title={`This Week: ${twScore}%`}
                        ></div>
                      </div>

                    </div>
                    <span className="text-[8px] md:text-[10px] font-bold text-on-surface/40">{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 md:mt-8 bg-surface-container-high rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl">insights</span>
              <p className="text-xs md:text-sm font-medium text-on-surface/80 leading-relaxed">{dynamicPhrase}</p>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* Real-time status card */}
            <div className="bg-white border border-outline-variant/15 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className={`w-2 h-2 rounded-full animate-pulse ${rtStatus.pulseBg}`}></div>
              </div>
              <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mb-4 md:mb-6">Real-time status</p>
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${rtStatus.iconBg}`}>
                  <span className="material-symbols-outlined text-3xl md:text-4xl">{rtStatus.icon}</span>
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-black text-on-surface transition-all duration-300">{rtStatus.title}</h4>
                  <p className="text-[10px] md:text-sm text-on-surface/40 font-mono tracking-tighter transition-all duration-300">{rtStatus.sub}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/live-monitor')}
                className="w-full py-3 md:py-4 bg-surface-container-low text-on-surface text-xs md:text-base font-bold rounded-xl md:rounded-2xl flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all"
              >
                Open live monitor <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
              </button>
            </div>

            {/* AI Advisor card */}
            <div className="p-6 md:p-8 bg-secondary/5 rounded-[2rem] md:rounded-[2.5rem] border border-secondary/10">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-secondary/10 rounded-xl md:rounded-2xl text-secondary">
                  <span className="material-symbols-outlined text-base md:text-2xl">auto_awesome</span>
                </div>
                <h4 className="font-bold text-on-surface text-sm md:text-base">AI Advisor</h4>
              </div>
              <p className={`text-[11px] md:text-sm text-on-surface/60 leading-relaxed italic ${loading ? 'opacity-40 animate-pulse' : ''}`}>
                {advisorMessage}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
