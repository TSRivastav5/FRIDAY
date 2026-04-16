import React from 'react';
import { useFinanceStore } from '../store/financeStore';

export const BottomNav = () => {
  const store = useFinanceStore();

  const getTabClass = (tabId) => {
    return store.activeTab === tabId
      ? "flex flex-col items-center justify-center text-[#81ecff] scale-110 drop-shadow-[0_0_5px_#81ecff] transition-all"
      : "flex flex-col items-center justify-center text-[#ac8aff]/50 hover:text-[#81ecff] hover:drop-shadow-md transition-all";
  };

  return (
    <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-8 items-center justify-center py-3 px-8 bg-purple-950/10 dark:bg-black/30 backdrop-blur-2xl rounded-full border border-[#81ecff]/10 shadow-[0_-10px_40px_rgba(0,229,255,0.05)]">
      <button onClick={() => store.setActiveTab('home')} className={getTabClass('home')}>
        <span className="material-symbols-outlined text-2xl">terminal</span>
        <span className="font-label text-[10px] uppercase tracking-tighter mt-1">System</span>
      </button>
      <button onClick={() => store.setActiveTab('investments')} className={getTabClass('investments')}>
        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
        <span className="font-label text-[10px] uppercase tracking-tighter mt-1">Capital</span>
      </button>
      <button onClick={() => store.setActiveTab('expenses')} className={getTabClass('expenses')}>
        <span className="material-symbols-outlined text-2xl">query_stats</span>
        <span className="font-label text-[10px] uppercase tracking-tighter mt-1">Flux</span>
      </button>
      <button onClick={() => store.setActiveTab('insights')} className={getTabClass('insights')}>
        <span className="material-symbols-outlined text-2xl">hub</span>
        <span className="font-label text-[10px] uppercase tracking-tighter mt-1">Core</span>
      </button>
    </footer>
  );
};
