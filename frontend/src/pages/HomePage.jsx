import React from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';
import { SalaryModal } from '../components/SalaryModal';

export const HomePage = () => {
  const store = useFinanceStore();
  const userName = store.user?.name || "Boss";
  const totalBalance = store.salary?.amount || 0;
  const showSalaryModal = store.showSalaryModal || false;

  return (
    <main className="relative z-10 pt-32 pb-40 px-4 max-w-7xl mx-auto flex flex-col items-center">
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] flex items-center justify-center mb-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 shadow-[0_0_60px_rgba(129,236,255,0.15)]"></div>
          <div className="absolute inset-4 rounded-full border border-primary/10 border-dashed animate-orbit"></div>
          <div className="absolute inset-8 rounded-full border-[10px] border-primary/5"></div>
          <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(129,236,255,0.4)]" viewBox="0 0 100 100">
            <circle className="text-primary/10" cx="50" cy="50" fill="none" r="46" stroke="currentColor" strokeWidth="2"></circle>
            <circle className="text-primary" cx="50" cy="50" fill="none" r="46" stroke="currentColor" strokeDasharray="210 289" strokeWidth="3"></circle>
          </svg>
          <div className="text-center z-20">
            <p className="font-headline text-xs tracking-[0.3em] uppercase text-primary-dim mb-2">Total Capital Flow</p>
            <h2 className="text-5xl md:text-7xl font-black text-primary font-headline tracking-tighter neon-text-cyan">
              {formatCurrency(totalBalance)}
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2 text-primary-fixed-dim">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="font-label text-sm font-bold tracking-widest">+12.4% SYSTEM GROWTH</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-label text-xs tracking-widest text-secondary uppercase font-bold">Monthly Salary Status</span>
              <span className="material-symbols-outlined text-secondary">payments</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-headline font-bold text-on-surface">94%</p>
                  <p className="text-[10px] text-on-surface-variant font-label tracking-wider uppercase">Allocated</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-headline font-semibold text-secondary">{formatCurrency(totalBalance)}</p>
                  <p className="text-[10px] text-on-surface-variant font-label tracking-wider uppercase">Current Cycle</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[94%] shadow-[0_0_10px_rgba(172,138,255,0.5)]"></div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-label text-xs tracking-widest text-primary uppercase font-bold">Active Protocols</span>
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
                <span className="text-[10px] font-label text-primary-fixed uppercase tracking-tighter">Real-time sync active</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => store.setSalaryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full hover:bg-primary/20 transition-all group">
                <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                <span className="font-label text-xs font-bold tracking-widest text-primary uppercase">Credit Salary</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full hover:bg-secondary/20 transition-all group">
                <span className="material-symbols-outlined text-secondary text-lg">security</span>
                <span className="font-label text-xs font-bold tracking-widest text-secondary uppercase">Lock Assets</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-variant/40 border border-outline-variant/30 rounded-full hover:bg-surface-variant transition-all group">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">sync</span>
                <span className="font-label text-xs font-bold tracking-widest text-on-surface-variant uppercase">Flux Sync</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-variant/40 border border-outline-variant/30 rounded-full hover:bg-surface-variant transition-all group">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">database</span>
                <span className="font-label text-xs font-bold tracking-widest text-on-surface-variant uppercase">Data Dump</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-primary">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Liquidity</p>
              <p className="text-sm font-headline font-bold">{formatCurrency((store.salary?.amount || 0) * 0.2)}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-secondary">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">query_stats</span>
            </div>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Flux Delta</p>
              <p className="text-sm font-headline font-bold">+1.82%</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">hub</span>
            </div>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Node Load</p>
              <p className="text-sm font-headline font-bold">24.5 ms</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-error">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">terminal</span>
            </div>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Sys Health</p>
              <p className="text-sm font-headline font-bold text-error">CRITICAL</p>
            </div>
          </div>
        </div>
      </div>
      
      <SalaryModal
        isOpen={showSalaryModal}
        onClose={() => store.setSalaryModal?.(false)}
        onSubmit={store.updateAllocation}
        currentAllocation={store.currentAllocation || { emi: 0, rent: 0, savings: 0 }}
      />
    </main>
  );
};
