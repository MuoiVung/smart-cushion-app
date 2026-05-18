import React, { useMemo, useState } from 'react';

export const Dashboard: React.FC = () => {
  // We use state to allow manual refreshing of the mockup if desired, but it will also pick a random one on mount.
  const [refreshKey, setRefreshKey] = useState(0);

  const scenario = useMemo(() => {
    const scenarios = [
      {
        score: '32%',
        sub: 'NEEDS WORK',
        color: 'text-error',
        emoji: '⚠️',
        thisWeek: [40, 35, 30, 25, 30, 35, 32],
        lastWeek: [50, 45, 40, 35, 40, 45, 50],
        totalSitting: '6.5h',
        poorPosture: '4.4h',
        alertCount: '45',
        advisor: '"We noticed you were slouching forward frequently today. Try to keep your screen at eye level to prevent neck strain."'
      },
      {
        score: '65%',
        sub: 'IMPROVING',
        color: 'text-secondary',
        emoji: '📈',
        thisWeek: [55, 60, 58, 62, 65, 68, 65],
        lastWeek: [40, 45, 50, 55, 60, 55, 50],
        totalSitting: '5.8h',
        poorPosture: '2.0h',
        alertCount: '23',
        advisor: '"You are making good progress! Try taking short breaks every 45 minutes to stand up and stretch."'
      },
      {
        score: '84%',
        sub: 'KEEP IT UP',
        color: 'text-tertiary',
        emoji: '🎉🦫',
        thisWeek: [65, 70, 72, 78, 80, 82, 84],
        lastWeek: [60, 62, 65, 68, 70, 75, 78],
        totalSitting: '5.2h',
        poorPosture: '28m',
        alertCount: '0',
        advisor: '"We noticed a slight right-leaning tendency during your last 2 sessions. Try adjusting your monitor 5cm to the left."'
      }
    ];
    // Randomly pick a scenario
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }, [refreshKey]);

  const stats = [
    { label: 'Total Sitting Time', value: scenario.totalSitting, sub: 'DAILY', color: 'text-on-surface' },
    { label: 'Poor Posture Time', value: scenario.poorPosture, sub: '', color: scenario.color }, // Match poor posture color to the score tier
    { label: 'Alert Count', value: scenario.alertCount, sub: '', color: Number(scenario.alertCount) > 0 ? 'text-error' : 'text-[#10b981]' },
    { label: 'Posture Score', value: scenario.score, sub: scenario.sub, color: scenario.color, emoji: scenario.emoji },
  ];

  const thisWeekScores = scenario.thisWeek;
  const lastWeekScores = scenario.lastWeek;

  const thisWeekAvg = thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length;
  const lastWeekAvg = lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length;
  const scoreChange = thisWeekAvg - lastWeekAvg;

  let dynamicPhrase = "";
  if (scoreChange > 0) {
    dynamicPhrase = `Your posture score increased by ${scoreChange.toFixed(1)}% this week. Keep it up!`;
  } else if (scoreChange === 0) {
    dynamicPhrase = `Your posture score stayed the same as last week. Stay consistent!`;
  } else {
    dynamicPhrase = `Your posture score dropped by ${Math.abs(scoreChange).toFixed(1)}% this week. Let's get back on track!`;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex flex-wrap justify-between items-center w-full px-4 md:px-8 py-6 md:py-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-on-surface leading-none">PostureAI</h1>
          <p className="text-lg md:text-xl font-medium tracking-tight text-on-surface/60 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4 md:gap-8 ml-auto md:ml-0">
          <nav className="hidden sm:flex gap-6 md:gap-8 items-center font-medium tracking-tight text-xs md:text-sm">
            <a className="text-on-surface/60 hover:text-primary transition-colors" href="#">Support</a>
            <a className="text-on-surface/60 hover:text-primary transition-colors" href="#">Docs</a>
          </nav>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="material-symbols-outlined text-on-surface/60 cursor-pointer text-xl md:text-2xl">notifications</span>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-container-low border border-outline-variant/10 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 md:px-8 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-outline-variant/5 transition-all hover:bg-surface-bright">
              <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mb-1 md:mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className={`text-2xl md:text-4xl font-black ${stat.color} tracking-tighter font-mono`}>{stat.value}</span>
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
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 md:gap-3 flex-1">
                  <div className="w-full max-w-[1.5rem] md:max-w-[3rem] flex items-end justify-center gap-0.5 md:gap-1 h-32 md:h-48 border-b border-outline-variant/20 relative">
                    <div className="bg-outline-variant/30 w-1.5 md:w-3 rounded-t-sm" style={{ height: `${lastWeekScores[i]}%` }}></div>
                    <div className="bg-primary w-2 md:w-4 rounded-t-sm shadow-lg shadow-primary/20" style={{ height: `${thisWeekScores[i]}%` }}></div>
                  </div>
                  <span className="text-[8px] md:text-[10px] font-bold text-on-surface/40">{day}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 md:mt-8 bg-surface-container-high rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl">insights</span>
              <p className="text-xs md:text-sm font-medium text-on-surface/80 leading-relaxed">{dynamicPhrase}</p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-white border border-outline-variant/15 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></div>
              </div>
              <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mb-4 md:mb-6">Real-time status</p>
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-3xl md:text-4xl">check_circle</span>
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-black text-on-surface">Good posture</h4>
                  <p className="text-[10px] md:text-sm text-on-surface/40 font-mono tracking-tighter">Confidence: 94.2%</p>
                </div>
              </div>
              <button className="w-full py-3 md:py-4 bg-surface-container-low text-on-surface text-xs md:text-base font-bold rounded-xl md:rounded-2xl flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all">
                Open live monitor <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
              </button>
            </div>

            <div className="p-6 md:p-8 bg-secondary/5 rounded-[2rem] md:rounded-[2.5rem] border border-secondary/10">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-secondary/10 rounded-xl md:rounded-2xl text-secondary">
                  <span className="material-symbols-outlined text-base md:text-2xl">auto_awesome</span>
                </div>
                <h4 className="font-bold text-on-surface text-sm md:text-base">AI Advisor</h4>
              </div>
              <p className="text-[11px] md:text-sm text-on-surface/60 leading-relaxed italic">
                {scenario.advisor}
              </p>
            </div>
          </div>
        </div>


      </section>
    </div>
  );
};
