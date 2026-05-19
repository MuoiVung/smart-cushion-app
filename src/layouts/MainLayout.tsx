import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { CapyTopBar } from '../components/CapyTopBar';
import { Confetti } from '../components/Confetti';
import { useGamification, STAMP_INFO } from '../lib/gamification';
import { cn } from '../lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const mobileNavItems = [
  { icon: 'home',     label: 'My Live',     path: '/live-monitor' },
  { icon: 'trending_up', label: 'Coach', path: '/' },
  { icon: 'palette',  label: 'Shop',      path: '/shop' },
  { icon: 'star',     label: 'Squad',     path: '/squad' },
  { icon: 'menu_book',label: 'Passport',  path: '/passport' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { newStamp, dismissStamp } = useGamification();
  return (
    <div className="min-h-screen bg-capy-bg font-body text-capy-text antialiased">
      <Sidebar />

      <main className="md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <CapyTopBar />
        {children}
      </main>

      <Confetti
        active={!!newStamp}
        onDone={dismissStamp}
        label={newStamp ? STAMP_INFO[newStamp].title : undefined}
      />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-capy-sidebar border-t border-capy-border flex justify-around items-center py-3 px-2 z-50 shadow-[0_-4px_12px_rgba(90,56,38,0.08)]">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 transition-all duration-300',
                isActive ? 'text-capy-brown scale-110' : 'text-capy-muted'
              )
            }
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
