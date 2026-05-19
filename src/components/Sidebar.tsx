import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useGamification } from '../lib/gamification';
import { useAuth } from '../context/AuthContext';

const mainItems = [
  { icon: 'home',         label: 'My Live',       path: '/live-monitor', public: true },
  { icon: 'trending_up', label: 'Coach',   path: '/dashboard',     public: false },
  { icon: 'insights', label: 'My Insights',   path: '/insights',      public: false },
  { icon: 'list_alt', label: 'My Session', path: '/history',       public: false },
];

const capyItems = [
  { icon: 'casino',          label: 'My Capy Gacha',     path: '/gacha',      public: false },
  { icon: 'auto_awesome',    label: 'My Collection',  path: '/collection', public: false },
  { icon: 'menu_book',       label: 'My Passport',    path: '/passport',   public: false },
];


const SidebarItem: React.FC<{ item: typeof mainItems[0], isDemo: boolean }> = ({ item, isDemo }) => {
  const isLocked = isDemo && !item.public;
  
  return (
    <NavLink 
      to={isLocked ? '#' : item.path} 
      className={({ isActive }) => cn(
        'mx-3 px-4 py-2.5 flex items-center justify-between rounded-2xl transition-colors text-sm font-medium',
        isActive && !isLocked
          ? 'bg-capy-active text-capy-brown font-bold shadow-sm'
          : 'text-capy-brown hover:bg-capy-hover',
        isLocked && 'opacity-50 cursor-not-allowed grayscale'
      )}
      onClick={(e) => isLocked && e.preventDefault()}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-xl">{item.icon}</span>
        <span>{item.label}</span>
      </div>
      {isLocked && <span className="material-symbols-outlined text-base">lock</span>}
    </NavLink>
  );
};

const sectionLabel = 'px-6 mt-6 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-capy-muted-2';

import { TransparentImage } from './TransparentImage';

export const Sidebar: React.FC = () => {
  const { state } = useGamification();
  const { user, logout, isDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-capy-sidebar flex flex-col py-6 hidden md:flex z-50 border-r border-capy-border overflow-y-auto custom-scrollbar">
      <div className="px-6 mb-2 flex items-center gap-3">
        <div className="w-12 h-12 bg-capy-brown rounded-2xl flex items-center justify-center shadow-sm rotate-3 p-1.5 overflow-hidden">
          <TransparentImage src="/assets/capybara/postures/nup.png" alt="Logo" className="w-full h-full object-contain brightness-110" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-capy-brown leading-none">Capy Squad</h2>
          <p className="text-[10px] text-capy-muted font-bold uppercase tracking-widest mt-0.5">PostureAI</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col mt-4">
        <p className={sectionLabel}>Profile</p>
        <div className="mx-3 mb-2 px-4 py-3 flex items-center gap-3 rounded-2xl text-sm bg-capy-brown/5 border border-capy-brown/10">
          <div className="w-8 h-8 rounded-full bg-capy-amber/20 flex items-center justify-center border border-capy-amber/30">
            {isDemo ? '🎮' : '👤'}
          </div>
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-black text-capy-brown truncate">{user?.username}</span>
            <span className="text-[10px] text-capy-muted font-bold uppercase tracking-widest">
              {isDemo ? 'Demo Mode' : 'Premium Member'}
            </span>
          </div>
        </div>

        <p className={sectionLabel}>Main</p>
        {mainItems.map(item => (
          <SidebarItem key={item.path} item={item} isDemo={isDemo} />
        ))}

        <p className={sectionLabel}>Squad</p>
        {capyItems.map(item => (
          <SidebarItem key={item.path} item={item} isDemo={isDemo} />
        ))}


        <div className="mt-auto pt-6 border-t border-capy-border/50 mx-3">

          <button 
            onClick={handleLogout}
            className={cn(
              "w-full mt-2 px-4 py-2.5 flex items-center gap-3 rounded-2xl text-sm font-bold transition-colors",
              isDemo 
                ? "bg-capy-amber text-white shadow-lg shadow-capy-amber/20 hover:bg-capy-amber/90" 
                : "text-capy-danger hover:bg-capy-danger/5"
            )}
          >
            <span className="material-symbols-outlined text-xl">
              {isDemo ? 'login' : 'logout'}
            </span>
            <span>{isDemo ? 'Login for Full Access' : 'Sign Out'}</span>
          </button>
        </div>
      </nav>

      <div className="mx-4 mt-6 bg-capy-card border border-capy-border rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-capy-amber inline-block" />
          <div className="flex flex-col leading-tight">
            <span className="font-black text-capy-text text-sm">Capy Cash</span>
            <span className="text-[10px] text-capy-muted">{state.streak}-day streak ★</span>
          </div>
        </div>
        <span className="font-black font-mono text-capy-brown">{state.gems}</span>
      </div>
    </aside>
  );
};
