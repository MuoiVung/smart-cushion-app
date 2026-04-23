import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#eff4ff] flex flex-col py-8 gap-y-2 hidden md:flex z-50 border-r border-outline-variant/10">
      <div className="px-8 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-widest font-bold text-on-surface">Clinical Portal</h2>
            <p className="text-[10px] text-on-surface/50 font-bold uppercase tracking-widest mt-1">Dr. Smith's Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "ml-4 pl-4 py-3 flex items-center gap-4 transition-all rounded-l-full font-bold text-sm uppercase tracking-widest",
                isActive
                  ? "text-primary bg-white/50 translate-x-1"
                  : "text-on-surface/70 hover:text-primary hover:bg-white/30"
              )
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 space-y-4">
        <button className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/10">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span className="text-xs uppercase tracking-widest">Start New Session</span>
        </button>
        
        <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-1">
          <a href="#" className="flex items-center gap-4 text-on-surface/70 hover:text-primary ml-4 py-2 transition-all text-xs uppercase tracking-widest font-bold">
            <span className="material-symbols-outlined text-sm">help</span> Help Center
          </a>
          <a href="#" className="flex items-center gap-4 text-on-surface/70 hover:text-primary ml-4 py-2 transition-all text-xs uppercase tracking-widest font-bold">
            <span className="material-symbols-outlined text-sm">logout</span> Logout
          </a>
        </div>
      </div>
    </aside>
  );
};
