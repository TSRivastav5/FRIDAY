import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency, generateId } from '../utils/helpers';

export const InvestmentsPage = () => {
  const store = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Equity',
    amount: '',
    currentValue: '',
  });

  useEffect(() => {
    // Fetch investments on mount
    store.fetchInvestments?.();
  }, []);

  const stats = store.portfolioStats || { totalInvested: 340000, totalValue: 412000, gainPercent: 12.4, gain: 72000 };
  const databaseInvestments = store.investments || [];

  // Default holdings as shown in the Stitch mockup if none are in store
  const defaultHoldings = [
    { id: 'h1', name: 'Axis Bluechip Fund', type: 'Equity', amount: 120000, currentValue: 132450, subType: 'Direct • Equity', colorBg: 'bg-blue-100', colorText: 'text-blue-600', icon: 'account_balance_wallet' },
    { id: 'h2', name: 'Parag Parikh Flexi Cap', type: 'Hybrid', amount: 90000, currentValue: 98200, subType: 'Growth • Hybrid', colorBg: 'bg-purple-100', colorText: 'text-purple-600', icon: 'trending_up' },
    { id: 'h3', name: 'Mirae Asset Emerging Blue', type: 'Equity', amount: 50000, currentValue: 48850, subType: 'Mid Cap • Equity', colorBg: 'bg-orange-100', colorText: 'text-orange-600', icon: 'pie_chart' },
    { id: 'h4', name: 'SBI Liquid Fund', type: 'Cash', amount: 80000, currentValue: 82500, subType: 'Debt • Cash', colorBg: 'bg-green-100', colorText: 'text-green-600', icon: 'payments' }
  ];

  // If there are user-created investments in the store, map them to holdings format
  const holdings = databaseInvestments.length > 0 
    ? databaseInvestments.map((inv, idx) => {
        const gain = inv.currentValue - inv.amount;
        const gPercent = inv.amount > 0 ? (gain / inv.amount) * 100 : 0;
        const colors = [
          { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'account_balance_wallet' },
          { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'trending_up' },
          { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'pie_chart' },
          { bg: 'bg-green-100', text: 'text-green-600', icon: 'payments' }
        ];
        const style = colors[idx % colors.length];
        return {
          id: inv._id || inv.id,
          name: inv.name,
          type: inv.type,
          amount: inv.amount,
          currentValue: inv.currentValue,
          subType: `Direct • ${inv.type}`,
          colorBg: style.bg,
          colorText: style.text,
          icon: style.icon,
          gain,
          gainPercent: gPercent
        };
      })
    : defaultHoldings;

  // Recalculate totals if using database investments
  const totalValue = databaseInvestments.length > 0 
    ? holdings.reduce((sum, h) => sum + h.currentValue, 0)
    : stats.totalValue;
  const totalInvested = databaseInvestments.length > 0
    ? holdings.reduce((sum, h) => sum + h.amount, 0)
    : stats.totalInvested;
  const totalGains = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 12.4;

  const handleAddHolding = async () => {
    if (formData.name && formData.amount) {
      const amt = parseInt(formData.amount);
      const curr = parseInt(formData.currentValue) || amt;
      try {
        await store.addInvestment({
          name: formData.name,
          type: formData.type,
          amount: amt,
          currentValue: curr,
        });
        setFormData({ name: '', type: 'Equity', amount: '', currentValue: '' });
        setShowForm(false);
      } catch (e) {
        console.error("Error adding holding:", e);
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center pb-32">
      {/* Top App Bar Component */}
      <header className="bg-inverse-surface w-full z-40 fixed top-0 left-0">
        <div className="flex justify-between items-center w-full px-5 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed-dim border border-outline-variant/20">
              <img 
                alt="Profile picture" 
                className="w-full h-full object-cover scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCX0xxkFY5XGvL5V1FBPkkAaob4937P2y3M3RJ9DbQw74sTgyAIlMOn1k20oEXYFkIg2PYiGAuiJWdIDYV6Ck-Q-3JwGIPTdzuFxNQE3FJsVTZQSpdtf_OhiVn352t4iBrRsH7I0bOnJxjE0JQNJKikbRdAvqj4cBomb0_BJQmvg6pvu415tFBoXMifvBPFv5WMN6jc-cTXO9KDF3xcRnOuU1vINj9JwAMNSbisVTYlFURbT4qm8vB-iBCV4AnXkE0RVr8VW-hoJ0"
              />
            </div>
            <h1 className="text-lg font-bold text-on-primary text-left">FinVault</h1>
          </div>
          <button className="text-on-primary opacity-70 hover:opacity-100 transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-md bg-surface min-h-screen pt-[72px] pb-32 flex flex-col items-stretch">
        {/* Portfolio Header Section */}
        <section className="bg-inverse-surface px-5 pt-6 pb-12 rounded-b-[40px] text-left">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-wider text-on-primary-fixed opacity-60">PORTFOLIO TOTAL</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-on-primary">{formatCurrency(totalValue)}</h2>
              <span className="flex items-center text-tertiary-fixed text-sm font-semibold">
                <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          {/* Horizontal Quick Stats */}
          <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar">
            <div className="min-w-[140px] bg-white/10 p-4 rounded-xl border border-white/5 text-left">
              <p className="text-[11px] font-semibold text-on-primary opacity-50 mb-1">INVESTED</p>
              <p className="text-base font-bold text-on-primary">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="min-w-[140px] bg-white/10 p-4 rounded-xl border border-white/5 text-left">
              <p className="text-[11px] font-semibold text-on-primary opacity-50 mb-1">TOTAL GAINS</p>
              <p className="text-base font-bold text-tertiary-fixed">{totalGains >= 0 ? '+' : ''}{formatCurrency(totalGains)}</p>
            </div>
            <div className="min-w-[140px] bg-white/10 p-4 rounded-xl border border-white/5 text-left">
              <p className="text-[11px] font-semibold text-on-primary opacity-50 mb-1">ACTIVE ASSETS</p>
              <p className="text-base font-bold text-on-primary">{holdings.length} Funds</p>
            </div>
          </div>
        </section>

        {/* Insights Banner */}
        <div className="px-5 -mt-6">
          <div className="bg-primary-container p-4 rounded-2xl flex items-start gap-3 shadow-lg text-left">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <p className="text-xs text-on-primary-container leading-relaxed">
              Your <span className="font-bold">Axis Bluechip</span> fund is outperforming 85% of your portfolio this quarter. Consider rebalancing.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="mx-5 mt-6 bg-white p-5 rounded-2xl border-[0.5px] border-outline-variant/30 space-y-4 text-left shadow-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-bold text-sm text-on-surface tracking-wider uppercase mb-2">Add New Investment</h3>
              <input
                type="text"
                placeholder="Asset Name (e.g. Axis Bluechip)"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm bg-background"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm bg-background"
              >
                <option value="Equity">Equity</option>
                <option value="Debt">Debt</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Cash">Cash</option>
              </select>
              <input
                type="number"
                placeholder="Invested Amount"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm bg-background"
              />
              <input
                type="number"
                placeholder="Current Value"
                value={formData.currentValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, currentValue: e.target.value }))}
                className="w-full px-4 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm bg-background"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 text-xs font-semibold border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                <button onClick={handleAddHolding} className="flex-1 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity">Add</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Holdings List */}
        <section className="px-5 mt-6 text-left">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">YOUR HOLDINGS</h3>
            <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">filter_list</span>
          </div>
          <div className="flex flex-col gap-3">
            {holdings.map((h) => {
              const gain = h.gain ?? (h.currentValue - h.amount);
              const gPercent = h.gainPercent ?? (h.amount > 0 ? (gain / h.amount) * 100 : 0);
              const isPositive = gain >= 0;

              return (
                <div key={h.id} className="bg-surface-container-lowest p-4 rounded-xl border-[0.5px] border-outline-variant/30 transition-transform active:scale-[0.99] hover:shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${h.colorBg || 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${h.colorText || 'text-blue-600'}`}>{h.icon || 'account_balance_wallet'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{h.name}</p>
                        <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{h.subType || `Direct • ${h.type}`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isPositive ? 'text-tertiary' : 'text-error'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(gain)}
                      </p>
                      <p className={`text-[11px] font-semibold ${isPositive ? 'text-tertiary' : 'text-error'}`}>
                        {gPercent.toFixed(1)}% {isPositive ? '↑' : '↓'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30">
                    <div>
                      <p className="text-[11px] font-semibold text-outline uppercase tracking-wider">INVESTED</p>
                      <p className="text-xs font-semibold">{formatCurrency(h.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-outline uppercase tracking-wider">CURRENT</p>
                      <p className="text-xs font-semibold">{formatCurrency(h.currentValue)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Action Bar (Floating above nav) */}
        <div className="fixed bottom-24 left-0 w-full px-5 z-30 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:brightness-110"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add Asset
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
