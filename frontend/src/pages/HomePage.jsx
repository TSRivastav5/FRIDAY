import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';
import { GoalTracker } from '../components/GoalTracker';

export const HomePage = () => {
  const store = useFinanceStore();
  const userName = store.user?.name || "Rahul";
  
  // Fetch telemetry insight on mount
  useEffect(() => {
    store.fetchTelemetryInsight?.();
  }, []);
  
  // Calculate dynamic values with default fallback to settings/profile
  const profile = store.user?.financialProfile || {};
  const totalSalary = store.salary?.amount || profile.monthlySalary || 0;
  
  const emi = store.currentAllocation?.emi ?? profile.fixedExpenses?.emiDefault ?? 0;
  const rent = store.currentAllocation?.rent ?? profile.fixedExpenses?.rent ?? 0;
  const sip = store.currentAllocation?.sip ?? profile.sipDefault ?? 0;
  const travel = store.currentAllocation?.travel ?? profile.travelDefault ?? 0;
  const bills = store.currentAllocation?.bills ?? profile.billsDefault ?? 0;
  
  const totalAllocated = emi + sip + rent + travel + bills;
  const availableBalance = totalSalary - totalAllocated;

  const showSalaryModal = store.showSalaryModal || false;



  // Determine dynamic month/date context
  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  const isSalaryCredited = !!store.salary?.amount;
  const salaryStatusText = isSalaryCredited
    ? `Salary ${formatCurrency(totalSalary)} credited`
    : `Salary pending`;

  // EMI due / overdue badge calculations
  const hasPaidEmiThisMonth = store.expenses?.some(exp => {
    const expDate = new Date(exp.date);
    const isThisMonth = expDate.getFullYear() === today.getFullYear() && expDate.getMonth() === today.getMonth();
    const isEmi = exp.category?.toLowerCase() === 'bills' && /emi/i.test(exp.description || '');
    return isThisMonth && isEmi;
  });

  const salaryDay = profile.salaryDay || 1;
  let emiBadge = null;
  if (emi > 0 && !hasPaidEmiThisMonth) {
    if (today.getDate() === salaryDay) {
      emiBadge = "Due today";
    } else if (today.getDate() > salaryDay) {
      emiBadge = "Overdue";
    }
  }

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
              <span className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">Good morning,</span>
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
          <p className="text-on-primary/80 text-[11px] font-semibold uppercase tracking-wider mb-1">
            {monthName} {year} · {salaryStatusText}
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-on-primary text-4xl font-semibold tracking-tighter">{formatCurrency(availableBalance)}</span>
          </div>
          <div className="flex items-center gap-2 text-tertiary-fixed-dim">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs">Available balance after commitments</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="flex-grow px-5 -mt-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: EMI */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col aspect-square justify-between active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="flex flex-col gap-2 text-left w-full">
              <div className="flex justify-between items-center w-full">
                <div className="w-8 h-8 rounded-lg bg-[#FFB038]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{color:'#92600A'}}>receipt_long</span>
                </div>
                {emiBadge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                    {emiBadge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">EMI DUE</p>
                <p className="text-xl font-bold text-on-surface">
                  {emi > 0 ? (
                    formatCurrency(emi)
                  ) : (
                    <span 
                      className="text-sm font-bold text-primary cursor-pointer hover:underline"
                      onClick={() => store.setSalaryModal(true)}
                    >
                      Set up →
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-left mt-auto">
              <p className="text-xs font-semibold" style={{color:'#92600A'}}>Active commitments</p>
            </div>
          </div>

          {/* Card 2: SIP */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col aspect-square justify-between active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="flex flex-col gap-2 text-left w-full">
              <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center">
                <span className="material-symbols-outlined" style={{color:'#1A7A36'}}>eco</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">SIP THIS MONTH</p>
                <p className="text-xl font-bold text-on-surface">
                  {sip > 0 ? (
                    formatCurrency(sip)
                  ) : (
                    <span 
                      className="text-sm font-bold text-primary cursor-pointer hover:underline"
                      onClick={() => store.setSalaryModal(true)}
                    >
                      Set up →
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-left mt-auto">
              <p className="text-xs font-semibold" style={{color:'#1A7A36'}}>Auto on 5th</p>
            </div>
          </div>

          {/* Card 3: Rent */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col aspect-square justify-between active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="flex flex-col gap-2 text-left w-full">
              <div className="w-8 h-8 rounded-lg bg-[#5856D6]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#5856D6]">home</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">RENT</p>
                <p className="text-xl font-bold text-on-surface">
                  {rent > 0 ? (
                    formatCurrency(rent)
                  ) : (
                    <span 
                      className="text-sm font-bold text-primary cursor-pointer hover:underline"
                      onClick={() => store.setSalaryModal(true)}
                    >
                      Set up →
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-left mt-auto">
              <p className="text-xs text-on-surface-variant">Paid · 1st</p>
            </div>
          </div>

          {/* Card 4: Travel */}
          <div className="bg-white p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col aspect-square justify-between active:scale-[0.98] hover:shadow-md hover:border-primary transition-all duration-200">
            <div className="flex flex-col gap-2 text-left w-full">
              <div className="w-8 h-8 rounded-lg bg-[#FF2D55]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#FF2D55]">directions_car</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-0.5">TRAVEL</p>
                <p className="text-xl font-bold text-on-surface">
                  {travel > 0 ? (
                    formatCurrency(travel)
                  ) : (
                    <span 
                      className="text-sm font-bold text-primary cursor-pointer hover:underline"
                      onClick={() => store.setSalaryModal(true)}
                    >
                      Set up →
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-left mt-auto">
              <p className="text-xs text-on-surface-variant">Budget set</p>
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
              {store.aiInsight || "Analyzing your financial telemetry to deliver personalized insights... Hang tight Boss! 🤖"}
            </p>
          </div>
          {/* Decorative atmospheric light */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 mb-8 space-y-3">
          <button
            onClick={() => store.setSalaryModal(true)}
            className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:shadow-lg shadow-primary-container/20"
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-lg">Salary credited</span>
          </button>
        </div>

        {/* Goal Tracker Section */}
        <div className="mt-6 border-t border-outline-variant/20 pt-6">
          <GoalTracker />
        </div>
      </main>
    </div>
  );
};
