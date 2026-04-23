import React from 'react';
import { Sidebar } from '../components/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      <Sidebar />
      <main className="md:ml-64 flex flex-col min-h-screen">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation (Optional stub) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/10 flex justify-around items-center py-4 px-2 z-50 shadow-lg">
        <div className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">videocam</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Monitor</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">insights</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Data</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </div>
      </nav>
    </div>
  );
};
