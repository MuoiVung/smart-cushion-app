import React, { useMemo } from 'react';
import {
  fetchSessions,
  fetchSummaries,
  getApiConfig,
  secToMin,
  toFriendlyBuckets,
  todayIso,
  type DailySummary,
  type SessionsResponse,
} from '../lib/api';
import { useApiData } from '../hooks/useApiData';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type DayBucket = {
  label: string;
  date: string;
  goodMin: number;
  poorMin: number;
};

function bucketByDay(sessions: SessionsResponse): DayBucket[] {
  const map = new Map<string, { good: number; poor: number }>();
  for (const s of sessions.sessions) {
    const d = s.start_time_iso.slice(0, 10);
    const durMin = secToMin(s.duration_sec);
    const poorMin = secToMin(s.poor_posture_duration_sec);
    const cur = map.get(d) ?? { good: 0, poor: 0 };
    cur.good += Math.max(0, durMin - poorMin);
    cur.poor += poorMin;
    map.set(d, cur);
  }
  
  // Calculate dynamic Monday -> Sunday ISO dates for the current calendar week
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const currentWeekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const out: DayBucket[] = [];
  currentWeekDates.forEach((date, i) => {
    const v = map.get(date) ?? { good: 0, poor: 0 };
    out.push({ label: DAY_LABELS[i], date, goodMin: v.good, poorMin: v.poor });
  });
  return out;
}

function weeklyStats(buckets: DayBucket[]) {
  let goodTotal = 0;
  let totalAll = 0;
  let best: DayBucket | null = null;
  let worst: DayBucket | null = null;
  for (const b of buckets) {
    const total = b.goodMin + b.poorMin;
    if (total === 0) continue;
    const goodPct = (b.goodMin / total) * 100;
    goodTotal += b.goodMin;
    totalAll += total;
    if (!best || goodPct > (best.goodMin / (best.goodMin + best.poorMin)) * 100) best = b;
    if (!worst || goodPct < (worst.goodMin / (worst.goodMin + worst.poorMin)) * 100) worst = b;
  }
  const weeklyScore = totalAll > 0 ? Math.round((goodTotal / totalAll) * 100) : 0;
  return { weeklyScore, best, worst };
}



function analyzeTimeOfDay(sessions: SessionsResponse) {
  const buckets = {
    morning: { good: 0, total: 0 },   // 06-12
    afternoon: { good: 0, total: 0 }, // 12-18
    evening: { good: 0, total: 0 },   // 18-00
    night: { good: 0, total: 0 },     // 00-06
  };

  for (const s of sessions.sessions) {
    const hour = new Date(s.start_time_iso).getHours();
    const g = s.duration_sec - s.poor_posture_duration_sec;
    const t = s.duration_sec;

    if (hour >= 6 && hour < 12) { buckets.morning.good += g; buckets.morning.total += t; }
    else if (hour >= 12 && hour < 18) { buckets.afternoon.good += g; buckets.afternoon.total += t; }
    else if (hour >= 18 && hour < 24) { buckets.evening.good += g; buckets.evening.total += t; }
    else { buckets.night.good += g; buckets.night.total += t; }
  }

  const getPct = (b: { good: number; total: number }) => (b.total > 0 ? (b.good / b.total) * 100 : null);
  return [
    { label: 'Morning', sub: '06:00 - 12:00', score: getPct(buckets.morning), icon: 'light_mode', color: 'text-amber-500' },
    { label: 'Afternoon', sub: '12:00 - 18:00', score: getPct(buckets.afternoon), icon: 'wb_sunny', color: 'text-primary' },
    { label: 'Evening', sub: '18:00 - 00:00', score: getPct(buckets.evening), icon: 'dark_mode', color: 'text-secondary' },
    { label: 'Night', sub: '00:00 - 06:00', score: getPct(buckets.night), icon: 'bedtime', color: 'text-blue-400' },
  ];
}

export const Insights: React.FC = () => {
  const cfg = useMemo(getApiConfig, []);
  const today = useMemo(todayIso, []);
  const from = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    return monday.toISOString().slice(0, 10);
  }, []);

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

  const summaries = useApiData<DailySummary[]>(
    () => fetchSummaries(cfg.deviceId, from, today),
    [cfg.deviceId, from, today],
  );
  const sessions = useApiData<SessionsResponse>(
    () => fetchSessions(cfg.deviceId, from, today),
    [cfg.deviceId, from, today],
  );

  const loading = summaries.loading || sessions.loading;
  const error = summaries.error || sessions.error;
  const refresh = () => {
    summaries.refresh();
    sessions.refresh();
  };

  // Generate active summaries (real cloud data only)
  const activeSummaries = useMemo<DailySummary[] | null>(() => {
    return summaries.data;
  }, [summaries.data]);

  const buckets = sessions.data ? bucketByDay(sessions.data) : [];
  const { weeklyScore: actualWeeklyScore } = weeklyStats(buckets);
  const weeklyScore = actualWeeklyScore;

  const timeOfDay = sessions.data ? analyzeTimeOfDay(sessions.data) : [];

  const totalAlerts = sessions.data ? sessions.data.sessions.reduce((sum, s) => sum + s.alert_count, 0) : 0;

  const totalSessions = sessions.data ? sessions.data.total_count : 0;

  // Aggregate Key Posture over 7 days (missing days count as 0% for the week)
  let upSum = 0, sfSum = 0, lbSum = 0, lrSum = 0, llSum = 0;
  if (activeSummaries) {
    for (const d of activeSummaries) {
      const fb = toFriendlyBuckets(d.posture_distribution_pct);
      upSum += fb.upright_pct;
      sfSum += fb.slouching_forward_pct;
      lbSum += fb.leaning_back_pct;
      lrSum += fb.leaning_right_pct;
      llSum += fb.leaning_left_pct;
    }
  }

  // Calculate final average percentages (always divided by 7)
  const upAvg = upSum / 7;
  const sfAvg = sfSum / 7;
  const lbAvg = lbSum / 7;
  const lrAvg = lrSum / 7;
  const llAvg = llSum / 7;

  // Build a 7-day posture distribution lookup (0=Mon, 6=Sun)
  const dailyDistribution = useMemo(() => {
    return currentWeekDates.map((date) => {
      const summary = (activeSummaries || []).find((s) => s.date === date);
      if (summary) {
        return toFriendlyBuckets(summary.posture_distribution_pct);
      }
      return {
        upright_pct: 0,
        slouching_forward_pct: 0,
        leaning_back_pct: 0,
        leaning_right_pct: 0,
        leaning_left_pct: 0,
      };
    });
  }, [currentWeekDates, activeSummaries]);

  const rows = [
    {
      label: 'Upright',
      color: 'bg-[#10b981]',
      textColor: 'text-[#10b981]',
      daily: dailyDistribution.map(d => d.upright_pct),
      sum: upSum,
      avg: upAvg,
    },
    {
      label: 'Slouching Forward',
      color: 'bg-error',
      textColor: 'text-error',
      daily: dailyDistribution.map(d => d.slouching_forward_pct),
      sum: sfSum,
      avg: sfAvg,
    },
    {
      label: 'Leaning Back',
      color: 'bg-[#a855f7]',
      textColor: 'text-[#a855f7]',
      daily: dailyDistribution.map(d => d.leaning_back_pct),
      sum: lbSum,
      avg: lbAvg,
    },
    {
      label: 'Leaning Right',
      color: 'bg-[#f59e0b]',
      textColor: 'text-[#f59e0b]',
      daily: dailyDistribution.map(d => d.leaning_right_pct),
      sum: lrSum,
      avg: lrAvg,
    },
    {
      label: 'Leaning Left',
      color: 'bg-[#60a5fa]',
      textColor: 'text-[#60a5fa]',
      daily: dailyDistribution.map(d => d.leaning_left_pct),
      sum: llSum,
      avg: llAvg,
    },
  ];

  const maxVal = Math.max(upAvg, sfAvg, lbAvg, lrAvg, llAvg);
  const dominantPostures = rows.filter(p => Math.abs(p.avg - maxVal) < 0.01 && p.avg > 0);
  const finalDominants = dominantPostures.length > 0 ? dominantPostures : [rows[0]];

  // Value node to display
  let keyPostureValue: React.ReactNode;
  let keyPostureColor = '';
  let isNode = false;

  if (finalDominants.length === 1) {
    keyPostureValue = finalDominants[0].label;
    keyPostureColor = finalDominants[0].textColor;
    isNode = false;
  } else {
    keyPostureValue = (
      <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs md:text-sm font-black leading-tight tracking-tight mt-1">
        {finalDominants.map((p, idx) => (
          <React.Fragment key={p.label}>
            {idx > 0 && <span className="text-on-surface/40 font-normal">&amp;</span>}
            <span className={p.textColor}>{p.label}</span>
          </React.Fragment>
        ))}
      </span>
    );
    isNode = true;
  }

  const primaryDominant = finalDominants[0];

  const getAiAdvisorMessage = (score: number, posture: string) => {
    if (score <= 50) {
      if (posture === 'Upright') return "You had some good posture moments this week. Keep going little by little.";
      if (posture === 'Slouching Forward') return "This week felt a little tough. Try to sit a bit more upright in your next sessions.";
      if (posture === 'Leaning Back') return "This week felt a little tough. You tend to recline too much — try moving your seat closer to the desk and keep your lower back supported.";
      if (posture === 'Leaning Left') return "This week felt a little tough. Try to sit a little more evenly and avoid leaning left for too long.";
      if (posture === 'Leaning Right') return "This week felt a little tough. Try to sit a little more evenly and avoid leaning right for too long.";
    } else if (score < 80) {
      if (posture === 'Upright') return "You're making progress this week. Upright posture showed up most often, so keep building on that.";
      if (posture === 'Slouching Forward') return "You're making progress this week. Keep going and try to reduce forward slouching in longer sessions.";
      if (posture === 'Leaning Back') return "You're making progress this week. Keep going and try to reduce reclining — make sure your monitor is at eye level so you don't need to lean back.";
      if (posture === 'Leaning Left') return "You're making progress this week. Keep going and try to stay a little more balanced instead of leaning left.";
      if (posture === 'Leaning Right') return "You're making progress this week. Keep going and try to stay a little more balanced instead of leaning right.";
    } else {
      if (posture === 'Upright') return "You did really well this week. Upright posture was your strongest pattern. Keep it up.";
      if (posture === 'Slouching Forward') return "You did really well this week. Keep it up and try to ease back on forward slouching a little more.";
      if (posture === 'Leaning Back') return "You did really well this week. Keep it up and try to maintain a neutral spine instead of reclining — your lower back will thank you.";
      if (posture === 'Leaning Left') return "You did really well this week. Keep it up and try to sit a little more evenly instead of leaning left.";
      if (posture === 'Leaning Right') return "You did really well this week. Keep it up and try to sit a little more evenly instead of leaning right.";
    }
    return "Performance stable. Keep it up!";
  };

  const trend = weeklyScore >= 80 ? '+3%' : weeklyScore >= 60 ? '+1%' : '-2%';

  const getScoreInfo = (s: number) => {
    if (s <= 50) return { sub: 'Needs Work', color: 'text-error', icon: null };
    if (s < 80) return { sub: 'Improving', color: 'text-secondary', icon: 'trending_up' };
    return { sub: 'Keep It Up', color: 'text-tertiary', icon: null };
  };

  const scoreInfo = getScoreInfo(weeklyScore);

  const stats = [
    {
      label: 'Weekly Posture Score',
      value: loading ? '—' : `${weeklyScore}%`,
      delta: trend,
      color: scoreInfo.color,
    },
    {
      label: 'Session Recorded',
      value: loading ? '—' : String(totalSessions),
      sub: '',
      color: 'text-on-surface',
    },
    {
      label: 'Alert Count',
      value: loading ? '—' : String(totalAlerts),
      sub: '',
      color: totalAlerts > 0 ? 'text-error' : 'text-[#10b981]',
    },
    {
      label: 'Key Posture',
      value: loading ? '—' : keyPostureValue,
      sub: '',
      color: keyPostureColor,
      isNode: loading ? false : isNode,
    },
  ];

  const weeklyData = useMemo(() => {
    return currentWeekDates.map((date, i) => {
      const label = DAY_LABELS[i];
      const summary = (activeSummaries || []).find((s) => s.date === date);
      if (summary) {
        const fb = toFriendlyBuckets(summary.posture_distribution_pct);
        const poorMin = secToMin(summary.poor_posture_duration_sec);
        const totalSittingMin = secToMin(summary.total_sitting_duration_sec);
        return {
          dayIndex: i,
          label,
          date,
          poorMin,
          totalSittingMin,
          upright: fb.upright_pct,
          slouch: fb.slouching_forward_pct,
          leaningBack: fb.leaning_back_pct,
          leaningRight: fb.leaning_right_pct,
          leaningLeft: fb.leaning_left_pct,
        };
      }
      return {
        dayIndex: i,
        label,
        date,
        poorMin: 0,
        totalSittingMin: 0,
        upright: 0,
        slouch: 0,
        leaningBack: 0,
        leaningRight: 0,
        leaningLeft: 0,
      };
    });
  }, [currentWeekDates, activeSummaries]);

  const downloadReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-spine-bg">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-after: always; }
          body { background: white !important; }
          .bg-surface-container-low { background: white !important; border: 1px solid #eee; }
        }
      `}</style>
      <header className="flex justify-between items-center w-full px-4 md:px-8 py-6 md:py-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-on-surface leading-none">My Insights</h1>
          <p className="text-lg md:text-xl font-medium tracking-tight text-on-surface/60 mt-1">Performance Analysis</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4 no-print">
          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-md shadow-black/5 disabled:opacity-40"
            title="Refresh data"
          >
            <span className={`material-symbols-outlined text-sm md:text-base ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>

          {/* Report button */}
          <button
            onClick={downloadReport}
            className="hidden sm:flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Report
          </button>
        </div>
      </header>

      <section className="px-4 md:px-8 pb-12">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <p className="text-xs text-error font-medium">Failed to load data from cloud. Showing mock data.</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`bg-white p-4 md:p-6 rounded-2xl border border-outline-variant/5 transition-all hover:bg-surface-bright shadow-sm ${loading ? 'animate-pulse' : ''}`}
            >
              <div className="flex justify-between items-start mb-1 md:mb-2">
                <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-on-surface/60">{stat.label}</p>
              </div>
              <div className="flex items-baseline gap-2">
                {stat.isNode ? (
                  stat.value
                ) : (
                  <span className={`text-2xl md:text-4xl font-black ${stat.color} tracking-tighter font-mono`}>{stat.value}</span>
                )}
                {('delta' in stat) && stat.delta && (
                  <span className={`text-[10px] md:text-xs font-bold ${stat.delta.startsWith('+') ? 'text-tertiary' : 'text-error'} whitespace-nowrap`}>
                    {stat.delta} vs last week
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Only render if data exists */}
        {sessions.data && (
          <>
            <div className="mb-8 md:mb-12">
              <div className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] md:rounded-3xl">
                <div className="mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-on-surface">Weekly Posture Pattern</h3>
                  <p className="text-xs md:text-sm text-on-surface/50">This week - posture distribution and poor posture time</p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="flex flex-col items-end w-24 md:w-28 shrink-0">
                    <div className="flex flex-col justify-between h-32 md:h-48 pr-2 text-[8px] md:text-[10px] text-on-surface/40 font-mono text-right border-r border-outline-variant/10 w-full">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    <div className="text-right h-10 md:h-12 w-full border-r border-transparent select-none pr-2">
                      <span className="text-[8px] md:text-[10px] font-bold text-on-surface/40 uppercase block mb-0.5 invisible">M</span>
                      <span className="text-[10px] md:text-xs text-on-surface/50 font-normal block leading-none whitespace-nowrap mt-[2px]">Poor posture time</span>
                      <span className="text-[10px] md:text-xs text-on-surface/50 font-normal block leading-none whitespace-nowrap mt-[4px]">Total sitting time</span>
                    </div>
                  </div>
                  <div className="flex flex-1 justify-between gap-1 items-start">
                    {weeklyData.map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex flex-1">
                        <div className="w-full max-w-[1.5rem] md:max-w-[2.5rem] flex flex-col justify-end h-32 md:h-48 rounded-md md:rounded-lg overflow-hidden bg-white/20">
                          <div className="bg-[#60a5fa] w-full transition-all" style={{ height: `${d.leaningLeft}%` }}></div>
                          <div className="bg-[#f59e0b] w-full transition-all" style={{ height: `${d.leaningRight}%` }}></div>
                          <div className="bg-[#a855f7] w-full transition-all" style={{ height: `${d.leaningBack}%` }}></div>
                          <div className="bg-error w-full transition-all" style={{ height: `${d.slouch}%` }}></div>
                          <div className="bg-[#10b981] w-full transition-all" style={{ height: `${d.upright}%` }}></div>
                        </div>
                        <div className="text-center h-10 md:h-12">
                          <span className="text-[8px] md:text-[10px] font-bold text-on-surface/40 uppercase block mb-0.5">{d.label}</span>
                          <span className="text-[8px] md:text-[10px] font-bold text-error block leading-none">{d.poorMin}m</span>
                          <span className="text-[8px] md:text-[10px] font-bold text-on-surface/60 block leading-none mt-[6px]">{d.totalSittingMin}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 md:gap-8 justify-center mt-6">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div><span className="text-[10px] md:text-xs font-bold text-on-surface/60">Upright</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-error"></div><span className="text-[10px] md:text-xs font-bold text-on-surface/60">Slouching Forward</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></div><span className="text-[10px] md:text-xs font-bold text-on-surface/60">Leaning Back</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div><span className="text-[10px] md:text-xs font-bold text-on-surface/60">Leaning Right</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]"></div><span className="text-[10px] md:text-xs font-bold text-on-surface/60">Leaning Left</span></div>
                </div>
                {/* Collapsible Key Posture Calculation Details Table */}
                <div className="mt-8 border-t border-outline-variant/10 pt-6">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm md:text-base text-primary">analytics</span>
                        <span className="text-xs md:text-sm font-bold text-on-surface hover:text-primary transition-colors">Key Posture Calculation Details</span>
                      </div>
                      <span className="material-symbols-outlined text-sm md:text-base text-on-surface/40 transition-transform group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
                      <table className="w-full text-left border-collapse text-[10px] md:text-xs">
                        <thead>
                          <tr className="bg-surface-container/50 border-b border-outline-variant/10 text-on-surface/60 font-bold uppercase tracking-wider">
                            <th className="p-3">Posture Category</th>
                            <th className="p-3 text-center">Mon</th>
                            <th className="p-3 text-center">Tue</th>
                            <th className="p-3 text-center">Wed</th>
                            <th className="p-3 text-center">Thu</th>
                            <th className="p-3 text-center">Fri</th>
                            <th className="p-3 text-center">Sat</th>
                            <th className="p-3 text-center">Sun</th>
                            <th className="p-3 text-center bg-surface-container">Sum</th>
                            <th className="p-3 text-center bg-primary/10 text-primary">Average (÷7)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                          {rows.map((row) => (
                            <tr key={row.label} className="hover:bg-surface-container/20 transition-colors">
                              <td className="p-3 font-bold flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${row.color}`}></span>
                                <span className={row.textColor}>{row.label}</span>
                              </td>
                              {row.daily.map((val, idx) => (
                                <td key={idx} className="p-3 text-center font-mono font-medium text-on-surface/70">
                                  {Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`}
                                </td>
                              ))}
                              <td className="p-3 text-center font-mono font-black text-on-surface bg-surface-container/50">
                                {Number.isInteger(row.sum) ? `${row.sum}%` : `${row.sum.toFixed(1)}%`}
                              </td>
                              <td className="p-3 text-center font-mono font-black bg-primary/5 text-primary">
                                {Number.isInteger(row.avg) ? `${row.avg}%` : `${row.avg.toFixed(1)}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-outline-variant/10 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-on-surface">My posture score by time of day</h3>
                    <p className="text-xs md:text-sm text-on-surface/50">Fatigue detection trends</p>
                  </div>
                  <span className="px-2 py-1 bg-surface-container rounded-lg text-[9px] md:text-[10px] font-black tracking-widest text-on-surface/40">7 days average</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                  {timeOfDay.map((t, i) => (
                    <div key={i} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-surface-container-low border border-outline-variant/5">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                        <span className={`material-symbols-outlined text-sm md:text-base ${t.color}`}>{t.icon}</span>
                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface/60 truncate">{t.label}</span>
                      </div>
                      <div className="mb-1.5 md:mb-2">
                        <span className={`text-xl md:text-2xl font-black font-mono ${t.score !== null ? (t.score <= 50 ? 'text-error' : t.score < 80 ? 'text-secondary' : 'text-tertiary') : 'text-on-surface/40'}`}>
                          {t.score !== null ? `${t.score.toFixed(1)}%` : '--'}
                        </span>
                      </div>
                      <p className="text-[8px] md:text-[10px] text-on-surface/40 font-medium uppercase truncate">{t.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-primary/10">
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="p-2 md:p-3 bg-primary text-white rounded-xl md:rounded-2xl flex-shrink-0">
                    <span className="material-symbols-outlined text-xl md:text-2xl">auto_awesome</span>
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-bold text-primary leading-tight">AI Advisor</h4>
                    <p className="text-[10px] md:text-xs text-primary/60">Personalized suggestion based on your posture data</p>
                  </div>
                </div>
                <p className="text-[13px] md:text-sm text-on-surface/70 leading-relaxed mb-6 italic">
                  {getAiAdvisorMessage(weeklyScore, primaryDominant.label)}
                </p>
                <div className="space-y-3">
                  <button className="w-full py-2.5 md:py-3 bg-primary text-white rounded-xl text-[10px] md:text-xs font-bold tracking-wide hover:opacity-90 transition-opacity">Correction Drill</button>
                  <button className="w-full py-2.5 md:py-3 bg-white text-on-surface/50 rounded-xl text-[10px] md:text-xs font-bold tracking-wide border border-outline-variant/20 hover:bg-surface-bright transition-colors">Set Alert</button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
