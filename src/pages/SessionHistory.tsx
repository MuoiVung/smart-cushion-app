import React, { useMemo } from 'react';
import {
  fetchSessions,
  getApiConfig,
  isMockMode,
  isoDaysAgo,
  todayIso,
  type SessionRecord,
} from '../lib/api';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart}, ${timePart}`;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function goodPct(s: SessionRecord): number {
  if (!s.duration_sec) return 0;
  return Math.round(((s.duration_sec - s.poor_posture_duration_sec) / s.duration_sec) * 100);
}

function getScoreDetails(score: number) {
  if (score <= 50) return { label: 'Needs Work', color: 'error', icon: null };
  if (score < 80) return { label: 'Improving', color: 'secondary', icon: 'trending_up' };
  return { label: 'Keep It Up', color: 'tertiary', icon: null };
}

function toCsv(sessions: SessionRecord[]): string {
  const header = 'Session ID,Session Start,End Time,Duration,Poor Posture Time,Alert Count,Posture Score';
  const rows = sessions.filter(Boolean).map((s) =>
    [
      s.session_id,
      s.start_time_iso,
      s.end_time_iso,
      s.duration_sec,
      s.poor_posture_duration_sec,
      s.alert_count,
      goodPct(s),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

function downloadCsv(sessions: SessionRecord[]) {
  const blob = new Blob([toCsv(sessions)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-history-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const SessionHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allSessions, setAllSessions] = React.useState<SessionRecord[]>([]);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [cloudAggregates, setCloudAggregates] = React.useState({
    total_duration_sec: 0,
    total_poor_duration_sec: 0,
    total_alerts: 0
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const pageSize = 10;
  const cfg = useMemo(getApiConfig, []);
  const today = useMemo(todayIso, []);
  const from = useMemo(() => isoDaysAgo(29), []);

  const fetchPage = async (page: number) => {
    const startIdx = (page - 1) * pageSize;
    
    // CACHE CHECK: If we already have data for the first item of this page, skip fetch
    if (allSessions[startIdx] !== undefined) return;

    setLoading(true);
    try {
      // Fetch exactly 1 page (10 items) starting at the correct offset
      const resp = await fetchSessions(cfg.deviceId, from, today, pageSize, startIdx);
      
      setAllSessions(prev => {
        const newList = [...prev];
        // Pad the array if we are jumping to a far page
        if (newList.length < startIdx + resp.sessions.length) {
          const filler = new Array(startIdx + resp.sessions.length - newList.length).fill(undefined);
          newList.push(...filler);
        }
        // Fill the specific slots for this page
        resp.sessions.forEach((s, idx) => {
          newList[startIdx + idx] = s;
        });
        return newList;
      });

      setTotalRecords(resp.total_count);
      if (resp.aggregates) {
        setCloudAggregates(resp.aggregates);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, cfg.deviceId, from, today]);

  const displayedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allSessions.slice(start, start + pageSize);
  }, [allSessions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setAllSessions([]);
    setTotalRecords(0);
    setCloudAggregates({ total_duration_sec: 0, total_poor_duration_sec: 0, total_alerts: 0 });
    setCurrentPage(1);
    fetchPage(1);
  };

  // AI Insights use Cloud-side totals, not just loaded sessions
  const totalSec = cloudAggregates.total_duration_sec;
  const totalPoorSec = cloudAggregates.total_poor_duration_sec;
  const totalAlerts = cloudAggregates.total_alerts;
  const avgGoodPct =
    totalSec > 0 ? Math.round(((totalSec - totalPoorSec) / totalSec) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center w-full px-4 md:px-8 py-4 bg-spine-bg print:hidden">
        <div className="flex items-center gap-4">
          <span className="text-xl md:text-2xl font-black tracking-tighter text-on-surface">PostureAI</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden md:flex gap-6 items-center">
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Support</a>
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Docs</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-on-surface/70 hover:text-primary transition-colors"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-xl md:text-2xl">refresh</span>
            </button>
            <button className="p-2 text-on-surface/70 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl md:text-2xl">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/10">
               <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-12 py-6 md:py-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter mb-1 md:mb-2 leading-none">My Session History</h1>
            <p className="text-on-surface/50 text-sm md:text-lg">
              {isMockMode()
                ? 'Last 1 month'
                : `Last 1 month · device ${cfg.deviceId}`}
            </p>
          </div>
          <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
            <button
              onClick={() => downloadCsv(allSessions)}
              disabled={!allSessions.length}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-primary border border-outline-variant/20 rounded-xl font-bold hover:bg-surface-bright transition-all shadow-sm text-xs md:text-base disabled:opacity-50 print:hidden"
            >
              <span className="material-symbols-outlined text-sm md:text-base">table_view</span>
              Export
            </button>
            <button
              onClick={() => window.print()}
              disabled={!allSessions.length}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-md text-xs md:text-base disabled:opacity-50 print:hidden"
            >
              <span className="material-symbols-outlined text-sm md:text-base">picture_as_pdf</span>
              PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 md:p-6 rounded-2xl bg-error-container text-on-error-container">
            <p className="font-bold mb-1">Cloud unavailable</p>
            <p className="text-xs md:text-sm opacity-80">{error}</p>
            <button onClick={handleRefresh} className="mt-3 text-xs md:text-sm font-bold underline">Try again</button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 lg:col-span-8 relative overflow-hidden bg-secondary/10 backdrop-blur-xl rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-secondary-fixed-dim/20">
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20">
                <span className="material-symbols-outlined text-2xl md:text-3xl">psychology</span>
              </div>
              <div>
                <h3 className="text-secondary font-black text-lg md:text-xl mb-1 md:mb-2">AI Advisor</h3>
                <p className="text-on-surface/70 leading-relaxed text-sm md:text-base">
                  Your posture score was <span className="text-secondary font-bold font-mono">{avgGoodPct}%</span> over the last 30 days.{' '}
                  {avgGoodPct >= 80 
                    ? "Keep it up and maintain your good sitting habits." 
                    : avgGoodPct >= 50 
                      ? "Keep going and aim for a more balanced sitting posture." 
                      : "Try to sit more upright in your next sessions."}
                </p>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${avgGoodPct >= 80 ? 'text-tertiary' : avgGoodPct >= 50 ? 'text-secondary' : 'text-error'}`}>
                      {avgGoodPct >= 80 ? 'check_circle' : avgGoodPct >= 50 ? 'trending_up' : 'error'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/60">Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${totalAlerts === 0 ? 'text-tertiary' : 'text-error'}`}>
                      {totalAlerts === 0 ? 'verified' : 'warning'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/60">Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">history</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/60">Trend</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <div className="col-span-12 lg:col-span-4 bg-surface-container-high rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h4 className="text-on-surface/40 uppercase text-[10px] md:text-xs tracking-widest font-bold mb-4 md:mb-6">Aggregate Biometrics</h4>
              <div className="space-y-4 md:space-y-6">
                {[
                  { label: 'Session Recorded', val: totalRecords, color: 'text-on-surface' },
                  { label: 'Posture Score', val: `${avgGoodPct}%`, color: `text-${getScoreDetails(avgGoodPct).color}` },
                  { label: 'Total Alerts', val: totalAlerts, color: 'text-error' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-end">
                    <span className="text-xs md:text-sm font-medium">{item.label}</span>
                    <span className={`font-mono text-xl md:text-2xl font-bold ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-sm">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left border-separate border-spacing-y-2 md:border-spacing-y-4">
                <thead>
                  <tr className="text-on-surface/40 uppercase text-[10px] md:text-xs tracking-widest font-bold">
                    <th className="px-2 md:px-6 py-2 md:py-4">Session Start</th>
                    <th className="px-2 md:px-6 py-2 md:py-4">Duration</th>
                    <th className="px-2 md:px-6 py-2 md:py-4">Posture Score</th>
                    <th className="px-2 md:px-6 py-2 md:py-4">Poor Posture Time</th>
                    <th className="px-2 md:px-6 py-2 md:py-4">Alert Count</th>
                  </tr>
                </thead>
                <tbody className="text-xs md:text-sm">
                  {(loading || displayedSessions.some(s => !s)) && allSessions.length === 0 && (
                    <>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={`skel-${i}`} className="animate-pulse">
                          <td className="px-2 md:px-6 py-4 md:py-6 bg-white rounded-l-2xl" colSpan={6}>
                            <div className="h-4 bg-surface-container rounded" />
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  {!loading && displayedSessions.every(s => !s) && allSessions.length > 0 && (
                    <>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={`jump-skel-${i}`} className="animate-pulse">
                          <td className="px-2 md:px-6 py-4 md:py-6 bg-white rounded-l-2xl" colSpan={6}>
                            <div className="h-4 bg-surface-container rounded opacity-20" />
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  {!loading && displayedSessions.length === 0 && !error && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface/40">
                        No sessions in the selected range.
                      </td>
                    </tr>
                  )}
                  {displayedSessions.filter(Boolean).map((s) => {
                    const score = goodPct(s);
                    const details = getScoreDetails(score);
                    const color = details.color;
                    return (
                      <tr key={s.session_id} className="group hover:bg-surface-container-low transition-all">
                        <td className="px-2 md:px-6 py-4 md:py-6 bg-white group-hover:bg-transparent rounded-l-xl md:rounded-l-2xl font-semibold">
                          {formatDate(s.start_time_iso)}
                        </td>
                        <td className="px-2 md:px-6 py-4 md:py-6 bg-white group-hover:bg-transparent font-mono">
                          {formatDuration(s.duration_sec)}
                        </td>
                        <td className="px-2 md:px-6 py-4 md:py-6 bg-white group-hover:bg-transparent">
                          <div className="flex items-center gap-2 md:gap-3">
                            <span className={`font-mono font-bold text-${color}`}>{score}%</span>
                            <span className="text-lg md:text-xl">
                              {score >= 80 ? '✨🦫' : score > 50 ? '🌱🦫' : '🏋️🦫'}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-4 md:py-6 bg-white group-hover:bg-transparent text-on-surface/70 font-mono text-xs">
                          <span className={`text-${color}`}>{formatDuration(s.poor_posture_duration_sec)}</span>
                        </td>
                        <td className="px-2 md:px-6 py-4 md:py-6 bg-white group-hover:bg-transparent">
                          <span className={`font-mono font-bold ${s.alert_count === 0 ? 'text-tertiary' : 'text-error'}`}>
                            {s.alert_count}
                          </span>
                        </td>
                        <td className="px-2 md:px-6 py-4 md:py-6 bg-white group-hover:bg-transparent rounded-r-xl md:rounded-r-2xl text-right">
                          <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors cursor-pointer text-base md:text-xl">chevron_right</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 px-2">
                <p className="text-on-surface/40 text-xs font-medium uppercase tracking-widest">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, allSessions.length)} of {totalRecords}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-outline-variant/20 text-on-surface hover:bg-surface-bright disabled:opacity-30 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  
                  {[...Array(totalPages)].slice(0, 10).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all shadow-sm ${
                          currentPage === pageNum 
                            ? 'bg-primary text-white shadow-primary/20' 
                            : 'bg-white border border-outline-variant/20 text-on-surface/60 hover:bg-surface-bright'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-outline-variant/20 text-on-surface hover:bg-surface-bright disabled:opacity-30 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
