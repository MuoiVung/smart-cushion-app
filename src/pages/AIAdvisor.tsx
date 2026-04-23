import React from 'react';

export const AIAdvisor: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen p-12">
      <header className="flex justify-between items-center w-full mb-12">
        <h1 className="text-2xl font-black tracking-tighter text-on-surface">AI Health Advisor</h1>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Support</a>
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Documentation</a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-on-surface/60 cursor-pointer">notifications</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="User headshot" 
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-[0_20px_40px_rgba(11,28,48,0.03)] flex flex-col h-[768px]">
          <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-low/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20">
                <span className="material-symbols-outlined text-3xl">psychology</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">PostureAI Advisor</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  <span className="text-xs font-medium text-on-surface/40 uppercase tracking-widest">Powered by Claude</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-on-surface/60">
                <span className="material-symbols-outlined">history</span>
              </button>
              <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-on-surface/60">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            <div className="flex gap-4 items-start max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-secondary">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </div>
              <div className="space-y-4">
                <div className="p-6 rounded-[2rem] rounded-tl-none bg-secondary/5 text-on-surface leading-relaxed border border-secondary/10">
                  <p className="mb-4">Based on today's clinical data, I've noticed a recurring pattern in your workstation ergonomics. Since <span className="font-mono font-bold text-secondary">14:00</span>, there is a consistent <span className="font-mono">7.5°</span> lateral lean to the right.</p>
                  <p className="mb-4">This specific shift often correlates with "mouse arm fatigue." Your trapezius muscle is likely compensating for the repetitive reaching motion. I recommend a <span className="font-bold">90-second postural reset</span>: focus on retracting your right scapula and aligning your sternum with the center of your monitor.</p>
                  <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/10 flex items-start gap-3 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-secondary">lightbulb</span>
                    <p className="text-sm italic text-secondary">Clinical Insight: Sustained lateral leaning increases pressure on your L4-L5 vertebrae by approximately 18%.</p>
                  </div>
                </div>
                <span className="text-[10px] text-on-surface/40 uppercase tracking-widest ml-2">Just now</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white border-t border-outline-variant/10">
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
              {[
                'How do I fix my mouse position?',
                'Show me my fatigue heat-map',
                'Schedule a stretch reminder'
              ].map((text, i) => (
                <button key={i} className="px-6 py-2.5 rounded-full border border-outline-variant/30 text-sm font-medium hover:bg-surface-container-low hover:border-secondary/30 transition-all text-on-surface/70">
                  {text}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center">
              <button className="w-full max-w-md bg-secondary text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-secondary/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3">
                <span className="material-symbols-outlined">analytics</span>
                Get my personalized advice
              </button>
              <div className="mt-8 w-full flex items-center gap-4 bg-surface-container-low px-6 py-2 rounded-2xl border-b-2 border-outline-variant/50 focus-within:border-secondary transition-colors">
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 text-on-surface" placeholder="Ask PostureAI anything about your ergonomics..." type="text"/>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-on-surface/40 hover:text-secondary">
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button className="p-2 text-on-surface/40 hover:text-secondary">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mt-12">
          <div className="col-span-8 bg-white p-8 rounded-3xl border border-outline-variant/5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface/40 mb-6">Real-time Biometric Stream</h4>
            <div className="flex justify-between items-end h-32 gap-2">
              {[60, 40, 80, 95, 70, 50, 85, 90, 65].map((h, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-lg transition-all ${i >= 6 && i <= 7 ? 'bg-secondary/40 border-t-2 border-secondary' : 'bg-primary/10'}`} 
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-mono text-on-surface/40">
              <span>13:00</span>
              <span>14:00 (Lean detected)</span>
              <span>15:00</span>
            </div>
          </div>
          <div className="col-span-4 bg-secondary/5 p-8 rounded-3xl border border-secondary/10 flex flex-col justify-between shadow-sm">
            <div>
              <span className="material-symbols-outlined text-secondary mb-4 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <h4 className="font-bold text-on-surface mb-2">Posture Score</h4>
              <p className="text-sm text-on-surface/60 leading-relaxed">Your current alignment is 12% better than your last session at this hour.</p>
            </div>
            <div className="text-4xl font-black text-secondary tracking-tighter">
              84<span className="text-sm font-normal text-on-surface/40 ml-1">/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
