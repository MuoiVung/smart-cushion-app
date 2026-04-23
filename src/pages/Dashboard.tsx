import React from 'react';

const stats = [
  { label: 'Posture today', value: '78%', sub: 'GOOD', color: 'text-primary' },
  { label: 'Sitting time', value: '5.2h', sub: 'NORMAL', color: 'text-on-surface' },
  { label: 'Alerts triggered', value: '12', sub: 'AMBER', color: 'text-secondary' },
  { label: 'Health score', value: '84', sub: '+4%', color: 'text-tertiary' },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center w-full px-8 py-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface">PostureAI</h1>
          <p className="text-sm font-medium tracking-tight text-on-surface/60">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex gap-8 items-center font-medium tracking-tight">
            <a className="text-on-surface/60 hover:text-primary transition-colors" href="#">Support</a>
            <a className="text-on-surface/60 hover:text-primary transition-colors" href="#">Documentation</a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-on-surface/60 cursor-pointer">notifications</span>
            <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant/10 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/5 transition-all hover:bg-surface-bright">
              <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className={`text-4xl font-black ${stat.color} tracking-tighter font-mono`}>{stat.value}</span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full mb-1">{stat.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-surface-container-low p-10 rounded-[3rem]">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-on-surface">Weekly progression</h3>
                <p className="text-sm text-on-surface/40">Aggregate posture alignment vs previous week</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-[10px] font-bold text-on-surface/60">CURRENT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                  <span className="text-[10px] font-bold text-on-surface/60">PREVIOUS</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between px-4">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-3">
                  <div className="w-12 flex items-end justify-center gap-1 h-48">
                    <div className="bg-outline-variant/30 w-3 rounded-t-full" style={{ height: `${40 + i * 5}%` }}></div>
                    <div className="bg-primary w-4 rounded-t-full shadow-lg shadow-primary/20" style={{ height: `${60 + i * 4}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface/40">{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border border-outline-variant/15 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></div>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mb-6">Real-time status</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-on-surface">Good posture</h4>
                  <p className="text-sm text-on-surface/40 font-mono tracking-tighter">Confidence: 94.2%</p>
                </div>
              </div>
              <button className="w-full py-4 bg-surface-container-low text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all">
                Open live monitor <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="p-8 bg-secondary/5 rounded-[2.5rem] border border-secondary/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h4 className="font-bold text-on-surface">AI Recommendation</h4>
              </div>
              <p className="text-sm text-on-surface/60 leading-relaxed italic">
                "We noticed a slight right-leaning tendency during your last 2 sessions. Try adjusting your monitor 5cm to the left."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
