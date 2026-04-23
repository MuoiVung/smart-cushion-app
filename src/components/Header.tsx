import React from 'react';

export const Header: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="px-6 md:px-12 lg:pr-32 lg:pl-20 pt-12 pb-12">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-on-surface/40 text-sm font-medium tracking-tight mb-1">Good afternoon, User</p>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface leading-tight">
            {currentDate}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#eff4ff] text-on-surface/60 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-fixed bg-surface-container-high">
            <img 
              className="w-full h-full object-cover" 
              alt="User avatar" 
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};
