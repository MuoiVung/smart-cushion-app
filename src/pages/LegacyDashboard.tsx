import React from 'react';

export const LegacyDashboard: React.FC = () => {
  return (
    <div className="bg-legacy-bg font-sans text-legacy-on-surface min-h-screen flex">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-legacy-surface-low flex flex-col py-8 gap-y-2 hidden md:flex z-50">
        <div className="px-8 mb-8">
          <h2 className="font-bold text-legacy-primary text-xl tracking-tighter">PostureAI</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-y-1">
          <div className="text-legacy-primary font-black bg-white/50 rounded-l-full ml-4 pl-4 py-3 flex items-center gap-4 transition-transform translate-x-1">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm uppercase tracking-widest font-bold">Home</span>
          </div>
          {['Live Monitor', 'Insights', 'AI Advisor', 'Session History', 'Settings'].map((item) => (
            <div key={item} className="text-legacy-on-surface/70 hover:text-legacy-primary ml-4 pl-4 py-3 flex items-center gap-4 transition-all hover:bg-white/30 cursor-pointer">
              <span className="material-symbols-outlined">{item.toLowerCase().replace(' ', '_')}</span>
              <span className="text-sm uppercase tracking-widest font-bold">{item}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto px-6 mb-4">
          <div className="bg-legacy-primary/10 rounded-xl p-4 border border-legacy-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-legacy-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-legacy-primary"></span>
              </span>
              <span className="text-legacy-primary font-bold text-xs uppercase tracking-tighter">Real-time Active</span>
            </div>
            <p className="text-[10px] text-legacy-on-surface/60 font-medium">Posture tracking via AI Vision is currently optimized.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 flex-1 bg-white">
        <header className="px-12 pt-12 pb-12">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-legacy-on-surface/40 text-sm font-medium tracking-tight mb-1">Good afternoon, Demo User</p>
              <h1 className="text-5xl font-black tracking-tighter text-legacy-on-surface leading-tight">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-legacy-surface-low text-legacy-on-surface/60 hover:text-legacy-primary transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-legacy-primary bg-legacy-surface-container">
                <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="px-12 mb-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Good posture today', value: '84%', color: 'text-legacy-primary', icon: 'trending_up' },
            { label: 'Sitting time', value: '5h 12m', color: 'text-legacy-on-surface' },
            { label: 'Alerts today', value: '12', color: 'text-amber-600', sub: 'Caution' },
            { label: 'Posture streak', value: '5 days', color: 'text-amber-600', emoji: '🔥' },
          ].map((stat, i) => (
            <div key={i} className="bg-legacy-surface-low rounded-3xl p-6 transition-all hover:bg-legacy-bg">
              <p className="text-xs uppercase tracking-widest font-bold text-legacy-on-surface/60 mb-4">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
                {stat.icon && <span className={`material-symbols-outlined ${stat.color} text-lg`}>{stat.icon}</span>}
                {stat.sub && <span className="text-xs font-bold text-amber-600/60 uppercase">{stat.sub}</span>}
                {stat.emoji && <span className="text-2xl">{stat.emoji}</span>}
              </div>
            </div>
          ))}
        </section>

        {/* Main Layout Split */}
        <section className="px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-24">
          <div className="lg:col-span-7">
            <div className="bg-legacy-surface-lowest border border-legacy-on-surface/5 rounded-[2rem] p-10 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black tracking-tight">Live posture</h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-legacy-primary/10 text-legacy-primary rounded-full">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-xs font-black uppercase tracking-widest">Good</span>
                </div>
              </div>
              <div className="relative w-full aspect-square max-w-[300px] mx-auto mb-10">
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                  <div className="bg-legacy-primary/40 rounded-2xl flex items-center justify-center"><span className="text-[10px] font-black text-white">FL</span></div>
                  <div className="bg-legacy-primary/20 rounded-2xl flex items-center justify-center"><span className="text-[10px] font-black text-legacy-primary">FR</span></div>
                  <div className="bg-legacy-primary/40 rounded-2xl flex items-center justify-center"><span className="text-[10px] font-black text-white">BL</span></div>
                  <div className="bg-legacy-primary/20 rounded-2xl flex items-center justify-center"><span className="text-[10px] font-black text-legacy-primary">BR</span></div>
                </div>
                <div className="absolute top-[42%] left-[38%] w-8 h-8 bg-white rounded-full shadow-2xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-legacy-primary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-legacy-primary rounded-[2rem] p-8 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-white/70">lightbulb</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Today's AI Tip</span>
              </div>
              <h4 className="text-xl font-bold leading-tight mb-4">Tilt your monitor 5° upwards to reduce cervical strain.</h4>
              <p className="text-white/60 text-sm leading-relaxed">Based on your sitting patterns from the last 2 hours.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LegacyDashboard;
