import React from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';

export const ProfilePage = () => {
  const store = useFinanceStore();

  const userName = store.user?.name || "Boss";
  const stats = store.portfolioStats || { totalInvested: 0, totalValue: 0, gainPercent: 0, gain: 0 };
  const totalBalance = store.salary?.amount || 0;

  return (
    <main className="pt-28 pb-32 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Profile Core Header */}
      <section className="col-span-12 flex flex-col items-center justify-center py-12 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none"></div>
        <div className="relative w-40 h-40 group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all duration-700"></div>
          <div className="relative w-full h-full rounded-full border border-primary/40 p-2 glass-panel shadow-[0_0_50px_rgba(129,236,255,0.2)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
              <img 
                alt="Avatar" 
                className="w-full h-full scale-110 object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCX0xxkFY5XGvL5V1FBPkkAaob4937P2y3M3RJ9DbQw74sTgyAIlMOn1k20oEXYFkIg2PYiGAuiJWdIDYV6Ck-Q-3JwGIPTdzuFxNQE3FJsVTZQSpdtf_OhiVn352t4iBrRsH7I0bOnJxjE0JQNJKikbRdAvqj4cBomb0_BJQmvg6pvu415tFBoXMifvBPFv5WMN6jc-cTXO9KDF3xcRnOuU1vINj9JwAMNSbisVTYlFURbT4qm8vB-iBCV4AnXkE0RVr8VW-hoJ0"
              />
            </div>
            {/* Orbiting Status Ring */}
            <div className="absolute -inset-4 border-2 border-dashed border-secondary/30 rounded-full animate-orbit pointer-events-none"></div>
          </div>
        </div>
        <div className="mt-8 text-center text-on-surface">
          <h1 className="font-headline text-4xl font-bold tracking-tight uppercase mb-2">{userName}</h1>
          <p className="font-label text-primary text-sm tracking-[0.3em] font-medium uppercase">Node ID: FRD-{store.user?._id?.substring(0,4) || '9982'}-ALPHA</p>
        </div>
      </section>

      {/* Main Bento Grid */}
      <div className="col-span-12 md:col-span-7 space-y-6">
        {/* Glass Settings Panel */}
        <div className="glass-panel border border-primary/10 rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-8xl pointer-events-none">tune</span>
          </div>
          <h2 className="font-headline text-xl font-bold text-primary mb-8 tracking-widest uppercase flex items-center gap-3">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>terminal</span>
            System Calibration
          </h2>
          <div className="space-y-8 relative z-10">
            {/* Toggle Switch: Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-on-surface">
                <span className="font-headline text-sm font-bold uppercase tracking-widest">Stealth Protocol</span>
                <span className="text-xs text-on-surface-variant font-body mt-0.5">Global dark mode visualization engine</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={store.isDarkMode} onChange={store.toggleDarkMode} className="sr-only peer"/>
                <div className="w-14 h-7 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-primary after:border-primary/50 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary/20 peer-checked:shadow-[0_0_15px_rgba(129,236,255,0.4)]"></div>
              </label>
            </div>
            
            {/* Toggle Switch: Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-on-surface">
                <span className="font-headline text-sm font-bold uppercase tracking-widest">Neural Feed</span>
                <span className="text-xs text-on-surface-variant font-body mt-0.5">Direct telemetry stream notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={true} />
                <div className="w-14 h-7 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-primary after:border-primary/50 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary/20 peer-checked:shadow-[0_0_15px_rgba(129,236,255,0.4)]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => alert("Access Logs initializing...")} className="flex items-center justify-center gap-3 py-4 glass-panel border border-primary/10 rounded-xl font-headline text-xs font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-all duration-300">
            <span className="material-symbols-outlined text-lg">history</span>
            Access Logs
          </button>
          <button onClick={() => store.logout()} className="flex items-center justify-center gap-3 py-4 glass-panel border border-error/20 rounded-xl font-headline text-xs font-bold uppercase tracking-[0.2em] text-error hover:bg-error/10 transition-all duration-300">
            <span className="material-symbols-outlined text-lg">power_settings_new</span>
            Deactivate
          </button>
        </div>
      </div>

      {/* Sidebar: Financial Hologram Stats */}
      <aside className="col-span-12 md:col-span-5 space-y-6">
        <div className="glass-panel border border-secondary/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-secondary/5 to-transparent -z-10"></div>
          <div className="flex items-center justify-between mb-8 text-secondary">
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.2em]">Capital Flow</h3>
            <span className="material-symbols-outlined opacity-50">query_stats</span>
          </div>
          <div className="space-y-6">
            <div className="relative">
              <p className="text-[10px] text-secondary/60 font-headline uppercase mb-1">Total Liquidity</p>
              <p className="text-4xl font-headline font-bold text-on-surface tracking-tighter">
                {formatCurrency(totalBalance)}
              </p>
              <div className="w-full h-1 bg-surface-container-high rounded-full mt-4 overflow-hidden">
                <div className="w-[70%] h-full bg-secondary shadow-[0_0_10px_rgba(172,138,255,0.5)]"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary/10">
              <div>
                <p className="text-[10px] text-secondary/60 font-headline uppercase">Yield 24H</p>
                <p className="text-lg font-headline font-medium text-primary-dim">{stats.gain >= 0 ? '+' : ''}{stats.gainPercent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-secondary/60 font-headline uppercase">Risk Index</p>
                <p className="text-lg font-headline font-medium text-secondary-fixed">LOW</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-primary/20 p-4 flex items-center gap-4 bg-primary/5">
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
              <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
              <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="85, 100" strokeLinecap="round" strokeWidth="3"></path>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-headline text-primary font-bold">85%</span>
          </div>
          <div className="text-on-surface">
            <p className="font-headline text-[10px] uppercase font-bold text-primary">Node Stability</p>
            <p className="text-xs text-on-surface-variant">Syncing with global matrix...</p>
          </div>
        </div>
      </aside>
    </main>
  );
};
