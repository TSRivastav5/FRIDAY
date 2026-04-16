import React from 'react';
import { useFinanceStore } from '../store/financeStore';

export const Header = () => {
  const store = useFinanceStore();

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] z-50 bg-cyan-950/20 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(172,138,255,0.1)] flex justify-between items-center px-6 py-3 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] animate-pulse-slow">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
            <img 
              alt="AI Core" 
              className="w-full h-full object-cover opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAkoem7PnIjOeJ5_bqlxFErNu1-OZaWVeYtwbb6h3w58kwDJqTU_nsRtgGQI9dG3n9cy6oObKq5IOPXfKzq0Nj0fpdXQuTnEwfqFpSFNBAAjV1JGlO7B2qMgWdYUBPyBkWJ2-7XqWPz8WfHWc12T-sGynIeSFN8CU_fgnUe7tB5dXf0uP_oamfMor7kCAcRhjhjxsmwzd7evlm4dr0u0Jk9k9Dqj0x7MrbV3d8_FPCRvCEL3acY4gNQVIDZ71r_oey0yk7JZAmEy0"
            />
          </div>
        </div>
        <span className="text-xl font-black tracking-widest text-[#81ecff] drop-shadow-[0_0_8px_rgba(129,236,255,0.6)] font-headline">FRIDAY OS</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <nav className="flex gap-6 font-headline uppercase tracking-[0.15em] text-sm font-bold">
          <button onClick={() => store.setActiveTab('home')} className={`${store.activeTab === 'home' ? 'text-[#81ecff] drop-shadow-cyan' : 'text-cyan-100/40 hover:text-[#81ecff]'} transition-all`}>System</button>
          <button onClick={() => store.setActiveTab('investments')} className={`${store.activeTab === 'investments' ? 'text-[#81ecff] drop-shadow-cyan' : 'text-cyan-100/40 hover:text-[#81ecff]'} transition-all`}>Capital</button>
          <button onClick={() => store.setActiveTab('expenses')} className={`${store.activeTab === 'expenses' ? 'text-[#81ecff] drop-shadow-cyan' : 'text-cyan-100/40 hover:text-[#81ecff]'} transition-all`}>Flux</button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => store.setActiveTab('profile')} className="p-2 rounded-lg hover:bg-cyan-400/10 transition-all duration-300 text-[#81ecff]">
          <span className="material-symbols-outlined">settings_input_component</span>
        </button>
      </div>
    </header>
  );
};
