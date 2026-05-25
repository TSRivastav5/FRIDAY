import React, { useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';

export const HomePage = () => {
  const store = useFinanceStore();
  const userName = store.user?.name || "Rahul";
  
  // Calculate dynamic values
  const totalSalary = store.salary?.amount || 0;
  const emi = store.currentAllocation?.emi ?? 0;
  const sip = store.currentAllocation?.sip ?? 0;
  const rent = store.currentAllocation?.rent ?? 0;
  const travel = store.currentAllocation?.travel ?? 0;
  const bills = store.currentAllocation?.bills ?? 0;
  
  const totalAllocated = emi + sip + rent + travel + bills;
  const availableBalance = totalSalary - totalAllocated;

  const showSalaryModal = store.showSalaryModal || false;

  // Local state for the Salary Credited button simulation
  const [creditStatus, setCreditStatus] = useState('idle'); // 'idle' | 'processing' | 'credited'

  const handleCreditSalary = async () => {
    if (creditStatus !== 'idle') return;
    
    setCreditStatus('processing');
    
    try {
      // Credit 85k salary in the background database
      await store.creditSalary(85000);
      
      // Simulate processing time for smooth micro-interaction
      setTimeout(() => {
        setCreditStatus('credited');
        
        // Open the redesigned smart allocation modal
        store.setSalaryModal(true);
        
        // Reset status back to idle after 1 second so it is ready for future actions
        setTimeout(() => {
          setCreditStatus('idle');
        }, 1000);
      }, 1200);
    } catch (err) {
      console.error("Failed to credit salary:", err);
      setCreditStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body antialiased flex flex-col pb-32">
      {/* Top Navigation / Header */}
      <header className="bg-inverse-surface text-on-primary docked full-width top-0 rounded-b-none z-50">
        <div className="flex justify-between items-center w-full px-5 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border-2 border-primary-container">
              <img 
                alt="Profile picture" 
                className="w-full h-full object-cover scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCX0xxkFY5XGvL5V1FBPkkAaob4937P2y3M3RJ9DbQw74sTgyAIlMOn1k20oEXYFkIg2PYiGAuiJWdIDYV6Ck-Q-3JwGIPTdzuFxNQE3FJsVTZQSpdtf_OhiVn352t4iBrRsH7I0bOnJxjE0JQNJKikbRdAvqj4cBomb0_BJQmvg6pvu415tFBoXMifvBPFv5WMN6jc-cTXO9KDF3xcRnOuU1vINj9JwAMNSbisVTYlFURbT4qm8vB-iBCV4AnXkE0RVr8VW-hoJ0"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-on-surface-variant opacity-70 text-[11px] font-semibold uppercase tracking-wider">Good morning,</span>
              <span className="text-lg font-bold text-on-primary">{userName} 👋</span>
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container text-on-primary active:scale-95 transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Hero Balance Section */}
      <section className="bg-inverse-surface px-5 pt-4 pb-12 rounded-b-[40px] shadow-sm text-left">
        <div className="max-w-7xl mx-auto">
          <p className="text-on-surface-variant opacity-70 text-[11px] font-semibold uppercase tracking-wider mb-1">Available balance</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-on-primary text-4xl font-semibold tracking-tighter">{formatCurrency(availableBalance)}</span>
          </div>
          <div className="flex items-center gap-2 text-tertiary-fixed-dim">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs">After all commitments</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="flex-grow px-5 -mt-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: EMI */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col justify-between aspect-square active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-[#FFB038]/10 flex items-center justify-center mb-3 self-start">
              <span className="material-symbols-outlined text-[#FFB038]">receipt_long</span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-on-surface-variant opacity-70 uppercase mb-1">EMI DUE</p>
              <p className="text-xl font-bold text-on-surface mb-1">{formatCurrency(emi)}</p>
              <p className="text-xs text-[#FFB038]">Active commitments</p>
            </div>
          </div>

          {/* Card 2: SIP */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col justify-between aspect-square active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center mb-3 self-start">
              <span className="material-symbols-outlined text-[#34C759]">eco</span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-on-surface-variant opacity-70 uppercase mb-1">SIP THIS MONTH</p>
              <p className="text-xl font-bold text-on-surface mb-1">{formatCurrency(sip)}</p>
              <p className="text-xs text-[#34C759]">Auto on 5th</p>
            </div>
          </div>

          {/* Card 3: Rent */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col justify-between aspect-square active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-[#5856D6]/10 flex items-center justify-center mb-3 self-start">
              <span className="material-symbols-outlined text-[#5856D6]">home</span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-on-surface-variant opacity-70 uppercase mb-1">RENT</p>
              <p className="text-xl font-bold text-on-surface mb-1">{formatCurrency(rent)}</p>
              <p className="text-xs text-on-surface-variant opacity-60">Paid • 1st</p>
            </div>
          </div>

          {/* Card 4: Travel */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col justify-between aspect-square active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-[#FF2D55]/10 flex items-center justify-center mb-3 self-start">
              <span className="material-symbols-outlined text-[#FF2D55]">directions_car</span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-on-surface-variant opacity-70 uppercase mb-1">TRAVEL</p>
              <p className="text-xl font-bold text-on-surface mb-1">{formatCurrency(travel)}</p>
              <p className="text-xs text-on-surface-variant opacity-60">Budget set</p>
            </div>
          </div>
        </div>

        {/* AI Insight Banner */}
        <div className="mt-6 bg-primary-fixed/30 p-4 rounded-xl border-[0.5px] border-primary-fixed flex gap-4 items-start relative overflow-hidden group text-left">
          <div className="bg-primary-container text-on-primary p-2 rounded-lg flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-on-surface leading-relaxed">
              Your ELSS SIP is up <span className="font-bold text-tertiary">14.2% YTD</span>. Consider increasing by ₹500 — it costs you ₹150/month less in tax.
            </p>
          </div>
          {/* Decorative atmospheric light */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 mb-8 space-y-3">
          {creditStatus === 'idle' && (
            <button 
              onClick={handleCreditSalary}
              className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span className="text-lg">Salary credited</span>
            </button>
          )}

          {creditStatus === 'processing' && (
            <button 
              className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 cursor-not-allowed opacity-90"
              disabled
            >
              <span className="animate-spin material-symbols-outlined">autorenew</span>
              <span className="text-lg">Processing...</span>
            </button>
          )}

          {creditStatus === 'credited' && (
            <button 
              className="w-full bg-tertiary-container text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 cursor-default"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-lg">Credited!</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
