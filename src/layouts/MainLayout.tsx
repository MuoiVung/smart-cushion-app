import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="bg-[#f8f9ff] font-body text-on-surface selection:bg-primary-fixed-dim min-h-screen">
      <Sidebar />
      <main className="md:ml-64 min-h-screen bg-white">
        <Header />
        {children}
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/10 flex justify-around items-center py-4 px-6 z-50">
        <span className="material-symbols-outlined text-primary">dashboard</span>
        <span className="material-symbols-outlined text-on-surface/40">videocam</span>
        <span className="material-symbols-outlined text-on-surface/40">insights</span>
        <span className="material-symbols-outlined text-on-surface/40">settings</span>
      </nav>
    </div>
  );
};
