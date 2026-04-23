import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center w-full px-8 py-4 bg-[#f8f9ff] fixed top-0 z-50">
        <div className="text-2xl font-black tracking-tighter text-on-surface">PostureAI</div>
        <nav className="hidden md:flex gap-8 items-center font-['Inter'] font-medium tracking-tight">
          <a className="text-on-surface/60 hover:text-primary transition-colors duration-200" href="#">Support</a>
          <a className="text-on-surface/60 hover:text-primary transition-colors duration-200" href="#">Documentation</a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary scale-95 duration-150">notifications</button>
          <button className="material-symbols-outlined text-primary scale-95 duration-150">account_circle</button>
        </div>
      </header>

      <main className="pt-24 px-12 pb-12 min-h-screen">
        <header className="mb-12">
          <h1 className="text-[3.5rem] font-black tracking-tighter leading-tight text-on-surface">System Settings</h1>
          <p className="text-on-surface/60 max-w-2xl mt-2 font-medium">Configure your clinical hardware connection, threshold parameters, and account export preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column */}
          <div className="space-y-12">
            <section className="bg-white p-10 rounded-[2rem] border border-transparent hover:bg-surface-bright transition-colors shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">hub</span>
                <h2 className="text-xl font-bold tracking-tight">Device Connection</h2>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40 px-1">Network IP</label>
                    <input className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant py-3 px-1 font-mono text-primary focus:ring-0 focus:border-primary transition-all" type="text" defaultValue="192.168.1.42"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40 px-1">Communication Port</label>
                    <input className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant py-3 px-1 font-mono text-primary focus:ring-0 focus:border-primary transition-all" type="text" defaultValue="8080"/>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
                    <span className="text-sm font-mono text-on-surface/60">Status: <span className="text-tertiary font-bold">Active Node Detected</span></span>
                  </div>
                  <button className="px-6 py-2 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all">
                    Test Connection
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low p-10 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-secondary text-3xl">notifications_active</span>
                <h2 className="text-xl font-bold tracking-tight">Alert Thresholds</h2>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40">Response Delay</label>
                    <span className="font-mono text-secondary font-bold">4.5s</span>
                  </div>
                  <input className="w-full h-1 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary" max="10" min="0.5" step="0.5" type="range" defaultValue="4.5"/>
                  <p className="text-[11px] text-on-surface/40 italic leading-relaxed">Wait time before triggering a posture correction alert.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40">Correction Intensity</label>
                    <span className="font-mono text-secondary font-bold">72%</span>
                  </div>
                  <input className="w-full h-1 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary" max="100" min="0" step="1" type="range" defaultValue="72"/>
                  <p className="text-[11px] text-on-surface/40 italic leading-relaxed">Haptic motor feedback strength for wearable components.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-12">
            <section className="bg-white p-10 rounded-[2rem] border border-transparent hover:bg-surface-bright transition-colors shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <span className="material-symbols-outlined text-primary text-3xl">person_pin</span>
                <h2 className="text-xl font-bold tracking-tight">Clinician Profile</h2>
              </div>
              <div className="flex items-center gap-8 mb-10">
                <div className="relative">
                  <img 
                    className="w-24 h-24 rounded-3xl object-cover shadow-xl shadow-on-surface/5" 
                    alt="Clinician portrait" 
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-tertiary text-white p-1.5 rounded-full border-4 border-white">
                    <span className="material-symbols-outlined text-sm">verified</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface tracking-tighter">Dr. James Smith</h3>
                  <p className="text-sm font-mono text-primary font-bold">System ID: PKL-992-0X</p>
                </div>
              </div>
              <div className="bg-surface-container-low/50 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40">Linked Hardware</span>
                  <span className="font-mono text-xs bg-white px-3 py-1 rounded-full text-on-surface/60 border border-outline-variant/20">esp32-cushion-01</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40">Organization</span>
                  <span className="text-xs font-bold text-on-surface">Precision Kinetics Lab</span>
                </div>
              </div>
            </section>

            <section className="bg-secondary/5 p-10 rounded-[2rem] border border-secondary/10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-secondary text-3xl">database</span>
                <h2 className="text-xl font-bold tracking-tight">Data Export</h2>
              </div>
              <p className="text-sm text-on-surface/60 mb-8 leading-relaxed">Archive clinical sessions for insurance compliance or longitudinal patient studies.</p>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:bg-secondary/10 transition-all group border border-outline-variant/10 shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-3xl transition-transform group-hover:-translate-y-1">table_view</span>
                  <span className="text-[10px] uppercase tracking-widest font-black text-secondary">Export CSV</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:bg-secondary/10 transition-all group border border-outline-variant/10 shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-3xl transition-transform group-hover:-translate-y-1">picture_as_pdf</span>
                  <span className="text-[10px] uppercase tracking-widest font-black text-secondary">Export PDF</span>
                </button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-secondary/40 text-sm">history</span>
                <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-tighter">Last exported 2 days ago</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
