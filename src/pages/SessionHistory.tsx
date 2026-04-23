import React from 'react';

export const SessionHistory: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center w-full px-8 py-4 bg-[#f8f9ff]">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tighter text-on-surface">PostureAI</span>
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex gap-6 items-center">
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Support</a>
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Documentation</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="p-2 text-on-surface/70 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface/70 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-12 py-10 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black text-on-surface tracking-tighter mb-2">Session History</h1>
            <p className="text-on-surface/50 text-lg">Retrospective analysis of biometric alignment data.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white text-primary border border-outline-variant/20 rounded-xl font-bold hover:bg-surface-bright transition-all shadow-sm">
            <span className="material-symbols-outlined">download</span>
            Download CSV
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 bg-white rounded-[2rem] p-8 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-on-surface/40 uppercase text-xs tracking-widest font-bold">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Good %</th>
                    <th className="px-6 py-4">Worst Posture</th>
                    <th className="px-6 py-4">Alerts</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { date: 'Apr 11, 2024', duration: '01:45:22', score: 78, worst: 'Forward Head', alerts: 12, color: 'primary' },
                    { date: 'Apr 10, 2024', duration: '02:10:15', score: 82, worst: 'Slumped Shoulders', alerts: 8, color: 'primary' },
                    { date: 'Apr 09, 2024', duration: '00:55:40', score: 91, worst: 'None', alerts: 2, color: 'tertiary' },
                    { date: 'Apr 08, 2024', duration: '03:20:10', score: 65, worst: 'Extreme Tilt', alerts: 24, color: 'error' },
                    { date: 'Apr 07, 2024', duration: '01:15:00', score: 89, worst: 'Pelvic Tilt', alerts: 5, color: 'primary' },
                  ].map((session, i) => (
                    <tr key={i} className="group hover:bg-surface-container-low transition-all">
                      <td className="px-6 py-6 bg-white group-hover:bg-transparent rounded-l-2xl font-semibold">{session.date}</td>
                      <td className="px-6 py-6 bg-white group-hover:bg-transparent font-mono">{session.duration}</td>
                      <td className="px-6 py-6 bg-white group-hover:bg-transparent">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full bg-${session.color}`} style={{ width: `${session.score}%` }}></div>
                          </div>
                          <span className={`font-mono font-bold text-${session.color}`}>{session.score}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-white group-hover:bg-transparent text-on-surface/70 italic">{session.worst}</td>
                      <td className="px-6 py-6 bg-white group-hover:bg-transparent">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          session.color === 'error' ? 'bg-error-container text-on-error-container' : 
                          session.color === 'tertiary' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 
                          'bg-primary-fixed text-on-primary-fixed-variant'
                        }`}>
                          {session.alerts} Warnings
                        </span>
                      </td>
                      <td className="px-6 py-6 bg-white group-hover:bg-transparent rounded-r-2xl text-right">
                        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors cursor-pointer">chevron_right</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 relative overflow-hidden bg-secondary/10 backdrop-blur-xl rounded-[2rem] p-8 border border-secondary-fixed-dim/20">
            <div className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-secondary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20">
                <span className="material-symbols-outlined text-3xl">psychology</span>
              </div>
              <div>
                <h3 className="text-secondary font-black text-xl mb-2">Long-term Progression AI Insight</h3>
                <p className="text-on-surface/70 leading-relaxed max-w-2xl">
                  Your spinal curvature stability has improved by <span className="text-secondary font-bold font-mono">14%</span> over the last 30 days. However, sessions lasting longer than 4 hours show a sharp decline in "Good %" after the 180-minute mark.
                </p>
                <button className="mt-6 text-secondary font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">
                  View full trend analysis <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-surface-container-high rounded-[2rem] p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h4 className="text-on-surface/40 uppercase text-xs tracking-widest font-bold mb-6">Aggregate Biometrics</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Avg Tilt Angle</span>
                  <span className="font-mono text-2xl font-bold">4.2°</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Spinal Stress Index</span>
                  <span className="font-mono text-2xl font-bold text-error">0.28</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Recovery Time</span>
                  <span className="font-mono text-2xl font-bold text-tertiary">15m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
      </button>
    </div>
  );
};
