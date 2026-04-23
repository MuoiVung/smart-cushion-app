import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { icon: 'dashboard', label: 'Home', path: '/' },
  { icon: 'videocam', label: 'Live Monitor', path: '/live-monitor' },
  { icon: 'insights', label: 'Insights', path: '/insights' },
  { icon: 'psychology', label: 'AI Advisor', path: '/ai-advisor' },
  { icon: 'history', label: 'Session History', path: '/history' },
  { icon: 'settings', label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#eff4ff] flex flex-col py-8 gap-y-2 hidden md:flex z-50">
      <div className="px-8 mb-8">
        <h2 className="font-headline font-black text-primary text-xl tracking-tighter">PostureAI</h2>
      </div>
      <nav className="flex-1 flex flex-col gap-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `ml-4 pl-4 py-3 flex items-center gap-4 transition-all rounded-l-full ${
                isActive
                  ? 'text-[#00685f] font-black bg-white/50 translate-x-1'
                  : 'text-[#0b1c30]/70 hover:text-[#00685f] hover:bg-white/30'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-['Inter'] text-sm uppercase tracking-widest font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-6 mb-4">
        <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="text-primary font-bold text-xs uppercase tracking-tighter">Real-time Active</span>
          </div>
          <p className="text-[10px] text-on-surface/60 font-medium">Posture tracking via AI Vision is currently optimized.</p>
        </div>
      </div>
      <div className="px-4 flex flex-col gap-y-1">
        <div className="text-[#0b1c30]/70 hover:text-[#00685f] ml-4 pl-4 py-2 flex items-center gap-4 transition-all cursor-pointer">
          <span className="material-symbols-outlined">help</span>
          <span className="font-['Inter'] text-xs uppercase tracking-widest font-bold">Help Center</span>
        </div>
        <div className="text-[#0b1c30]/70 hover:text-[#00685f] ml-4 pl-4 py-2 flex items-center gap-4 transition-all cursor-pointer">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-['Inter'] text-xs uppercase tracking-widest font-bold">Logout</span>
        </div>
      </div>
    </aside>
  );
};
