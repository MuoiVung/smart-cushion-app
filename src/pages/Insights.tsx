import React from 'react';

export const Insights: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Cloud Sync Banner */}
      <div className="bg-secondary/90 backdrop-blur-xl px-8 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-sm">cloud_done</span>
          <span className="text-xs font-medium tracking-wide">Insight mode — Viewing cloud data. Last sync 2 minutes ago.</span>
        </div>
        <button className="text-[10px] uppercase font-bold tracking-widest opacity-80 hover:opacity-100 transition-opacity">Dismiss</button>
      </div>

      <header className="px-8 py-6 flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-on-surface">PostureAI</h1>
          <p className="text-sm font-medium tracking-tight text-on-surface/60">Clinical Performance Analysis</p>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex gap-8">
            <a className="text-primary border-b-2 border-primary pb-1 font-['Inter'] font-medium tracking-tight" href="#">Support</a>
            <a className="text-on-surface/60 font-['Inter'] font-medium tracking-tight hover:text-primary transition-colors duration-200" href="#">Documentation</a>
          </nav>
          <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-6">
            <span className="material-symbols-outlined text-on-surface/60 cursor-pointer">notifications</span>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-low border border-outline-variant/20">
              <img 
                className="w-full h-full object-cover" 
                alt="User avatar" 
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
              />
            </div>
          </div>
        </div>
      </header>

      <section className="px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Weekly score', value: '--%', sub: 'GOOD', color: 'text-primary' },
            { label: 'Best day', value: 'Monday', sub: '--%', color: 'text-on-surface' },
            { label: 'Worst day', value: 'Thursday', sub: '--%', color: 'text-on-surface', subColor: 'text-error' },
            { label: 'Total alerts', value: '--', sub: 'AMBER', color: 'text-secondary', subBg: 'bg-[#fef3c7]', subTextColor: 'text-[#b45309]' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-outline-variant/5 transition-all hover:bg-surface-bright shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/50 mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className={`text-4xl font-black ${stat.color} tracking-tighter font-mono`}>{stat.value}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full mb-1 ${stat.subBg || 'bg-primary/10'} ${stat.subTextColor || stat.subColor || 'text-primary'}`}>
                  {stat.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-surface-container-low p-8 rounded-3xl">
            <div className="mb-8">
              <h3 className="text-xl font-bold tracking-tight text-on-surface">Posture breakdown this week</h3>
              <p className="text-sm text-on-surface/50">Volumetric analysis of spinal alignment</p>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
                <div 
                  className="absolute inset-0 rounded-full" 
                  style={{ background: 'conic-gradient(#00685f 0% 74%, #bcc9c6 74% 100%)' }}
                ></div>
                <div className="absolute inset-4 rounded-full bg-surface-container-low flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-primary font-mono">--%</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-on-surface/40">Aggregate</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Good', sub: 'Optimal Alignment', color: 'bg-primary' },
                  { label: 'Lean right', sub: 'Lateral Shift', color: 'bg-[#f59e0b]' },
                  { label: 'Slouch', sub: 'Kyphosis Risk', color: 'bg-error' },
                  { label: 'Other', sub: 'Inconclusive', color: 'bg-outline-variant' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-on-surface/50 uppercase font-mono">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-3xl">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-on-surface">Daily posture hours</h3>
                <p className="text-sm text-on-surface/50">Comparative metric of endurance</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-[10px] font-bold text-on-surface/60">GOOD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <span className="text-[10px] font-bold text-on-surface/60">POOR</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between px-4">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                <div key={day} className="flex-col items-center gap-2 flex">
                  <div className="w-10 flex flex-col justify-end h-48 rounded-lg overflow-hidden bg-white/20">
                    <div className="bg-error w-full" style={{ height: `${[10, 15, 25, 40, 20, 5, 8][i]}%` }}></div>
                    <div className="bg-primary w-full" style={{ height: `${[90, 85, 75, 60, 80, 95, 92][i]}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface/40">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-secondary-fixed rounded-2xl text-secondary">
              <span className="material-symbols-outlined text-3xl">auto_awesome</span>
            </div>
            <div className="flex-grow">
              <h4 className="text-lg font-bold mb-1">AI Recommendation</h4>
              <p className="text-sm text-on-surface/70 mb-4 max-w-2xl">
                Based on your data from Thursday, you tend to slouch significantly after 3:00 PM. We recommend a 5-minute scapular retraction exercise at 2:30 PM to reset your muscle memory.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-2 bg-secondary text-white rounded-xl text-xs font-bold tracking-wide hover:opacity-90 transition-opacity">Learn Exercise</button>
                <button className="px-6 py-2 bg-surface-container text-on-surface/60 rounded-xl text-xs font-bold tracking-wide hover:bg-surface-dim transition-colors">Set Reminder</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
