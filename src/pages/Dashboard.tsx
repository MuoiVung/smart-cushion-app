import React from 'react';

const stats = [
  { label: 'Good posture today', value: '--%', icon: 'trending_up', color: 'text-primary' },
  { label: 'Sitting time', value: '--h --m', icon: null, color: 'text-on-surface' },
  { label: 'Alerts today', value: '--', icon: null, color: 'text-amber-600', sub: 'Caution' },
  { label: 'Posture streak', value: '-- days', icon: '🔥', color: 'text-amber-600' },
];

const patterns = [
  { label: 'Longest bad posture streak', value: '--m' },
  { label: 'Peak risk time window', value: '--:-- PM - --:-- PM' },
  { label: 'Reminders sent today', value: '--' },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="px-6 md:px-12 lg:pr-32 lg:pl-20 pb-24">
      {/* Stats Grid */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#eff4ff] rounded-3xl p-6 transition-all hover:bg-white border border-transparent hover:border-outline-variant/10">
            <p className="text-xs uppercase tracking-widest font-bold text-on-surface/60 mb-4">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
              {stat.icon && stat.icon.length > 2 && (
                <span className="material-symbols-outlined text-primary text-lg">{stat.icon}</span>
              )}
              {stat.icon && stat.icon.length <= 2 && (
                <span className="text-2xl">{stat.icon}</span>
              )}
              {stat.sub && (
                <span className="text-xs font-bold text-amber-600/60 uppercase">{stat.sub}</span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Daily Patterns Section */}
      <section className="mb-12">
        <h3 className="text-xl font-black tracking-tight mb-6">Daily Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {patterns.map((pattern, i) => (
            <div key={i} className="bg-amber-50 rounded-3xl p-6 transition-all hover:bg-amber-100/50">
              <p className="text-xs uppercase tracking-widest font-bold text-amber-900/60 mb-4">{pattern.label}</p>
              <div className="text-4xl font-black text-amber-600 tracking-tighter mono font-mono">{pattern.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Layout Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Live Monitor */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-10 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black tracking-tight">Live posture</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="text-xs font-black uppercase tracking-widest">Good</span>
              </div>
            </div>
            <div className="relative w-full aspect-square max-w-[400px] mx-auto mb-10">
              <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                <div className="bg-primary/40 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">FL</span>
                </div>
                <div className="bg-primary/20 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">FR</span>
                </div>
                <div className="bg-primary/40 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">BL</span>
                </div>
                <div className="bg-primary/20 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">BR</span>
                </div>
              </div>
              <div className="absolute top-[42%] left-[38%] w-8 h-8 bg-white rounded-full shadow-2xl flex items-center justify-center">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-outline-variant/15 pt-8">
              <div>
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-1">Stability Score</p>
                <p className="text-lg font-black tracking-tight text-primary">--</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-lg font-bold tracking-tight mono font-mono">--%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Insights */}
        <div className="lg:col-span-5 space-y-8">
          <div className="relative overflow-hidden bg-secondary rounded-[2rem] p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary-fixed">lightbulb</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-fixed">Today's AI Tip</span>
              </div>
              <h4 className="text-xl font-bold leading-tight mb-4">Tilt your monitor 5° upwards to reduce cervical strain.</h4>
              <p className="text-secondary-fixed/70 text-sm leading-relaxed">Based on your sitting patterns from the last 2 hours, we noticed a slight forward head lean.</p>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-[#eff4ff] rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black tracking-tight">This week at a glance</h3>
              <span className="material-symbols-outlined text-on-surface/40">calendar_today</span>
            </div>
            <div className="flex items-end justify-between h-48 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col h-full rounded-full overflow-hidden bg-white/40">
                    <div className="bg-error/30" style={{ height: `${[20, 10, 35, 5, 15, 0, 0][i]}%` }}></div>
                    <div className="flex-1 bg-primary" style={{ opacity: day === 'Sat' || day === 'Sun' ? 0.2 : 1 }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface/40 uppercase">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
