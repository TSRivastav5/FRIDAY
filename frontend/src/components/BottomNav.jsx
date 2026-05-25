import React from 'react';
import { useFinanceStore } from '../store/financeStore';

export const BottomNav = () => {
  const store = useFinanceStore();

  const getTabClass = (tabId) => {
    return store.activeTab === tabId
      ? "flex flex-col items-center justify-center text-on-primary scale-110 transition-transform tap-highlight-none"
      : "flex flex-col items-center justify-center text-on-secondary-fixed-variant opacity-60 hover:opacity-100 transition-all duration-300";
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-inverse-surface border-t border-outline-variant/10 shadow-lg">
      {/* Home */}
      <button onClick={() => store.setActiveTab('home')} className={getTabClass('home')}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: store.activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        <span className="text-label-caps font-label-caps text-[10px]">Home</span>
      </button>

      {/* Invest */}
      <button onClick={() => store.setActiveTab('investments')} className={getTabClass('investments')}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: store.activeTab === 'investments' ? "'FILL' 1" : "'FILL' 0" }}>query_stats</span>
        <span className="text-label-caps font-label-caps text-[10px]">Invest</span>
      </button>

      {/* Ask AI */}
      <button onClick={() => store.setActiveTab('ask_ai')} className={getTabClass('ask_ai')}>
        <div className="relative">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: store.activeTab === 'ask_ai' ? "'FILL' 1" : "'FILL' 0" }}>auto_awesome</span>
          {store.activeTab !== 'ask_ai' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-container rounded-full"></div>
          )}
        </div>
        <span className="text-label-caps font-label-caps text-[10px]">Ask AI</span>
      </button>

      {/* History (Expenses) */}
      <button onClick={() => store.setActiveTab('expenses')} className={getTabClass('expenses')}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: store.activeTab === 'expenses' ? "'FILL' 1" : "'FILL' 0" }}>history</span>
        <span className="text-label-caps font-label-caps text-[10px]">History</span>
      </button>

      {/* Settings */}
      <button onClick={() => store.setActiveTab('profile')} className={getTabClass('profile')}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: store.activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
        <span className="text-label-caps font-label-caps text-[10px]">Settings</span>
      </button>
    </nav>
  );
};
