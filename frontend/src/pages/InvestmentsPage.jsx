import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency, generateId } from '../utils/helpers';
import { investmentTypes } from '../data/mockData';

export const InvestmentsPage = () => {
  const store = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SIP',
    amount: '',
    currentValue: '',
  });

  const stats = store.portfolioStats || { totalInvested: 0, totalValue: 0, gainPercent: 0, gain: 0 };
  const investments = store.investments || [];

  const handleAddInvestment = () => {
    if (formData.name && formData.amount) {
      store.addInvestment({
        id: generateId(),
        ...formData,
        amount: parseInt(formData.amount),
        currentValue: parseInt(formData.currentValue) || parseInt(formData.amount),
        date: new Date().toISOString().split('T')[0],
      });
      setFormData({ name: '', type: 'SIP', amount: '', currentValue: '' });
      setShowForm(false);
    }
  };

  const getTypeIcon = (type) => {
    const t = investmentTypes.find(i => i.id === type);
    return t ? t.icon : 'layers';
  };

  const getStyleForIndex = (index) => {
    const colors = ['primary', 'secondary', 'tertiary'];
    return colors[index % colors.length];
  };

  return (
    <main className="max-w-6xl mx-auto pt-24 px-6 pb-32">
      {/* AI Intelligence Layer */}
      <header className="flex flex-col items-center mb-16 text-center">
        <div className="w-20 h-20 mb-6 relative">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-orbit border-dashed"></div>
          <div className="absolute inset-2 rounded-full border border-secondary/40 animate-spin" style={{animationDirection: "reverse", animationDuration: "10s"}}></div>
          <div className="absolute inset-4 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>hub</span>
          </div>
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-light tracking-tighter text-on-surface mb-2">
          {formatCurrency(stats.totalValue)}
        </h1>
        <div className="flex items-center gap-2 text-primary-fixed font-headline tracking-widest text-sm bg-primary/5 px-4 py-1 rounded-full border border-primary/20">
          <span className="material-symbols-outlined text-xs">trending_up</span>
          <span>{stats.gain >= 0 ? '+' : ''}{stats.gainPercent.toFixed(1)}% PERFORMANCE CYCLE</span>
        </div>
        <p className="mt-8 font-label text-secondary-dim text-sm tracking-widest uppercase">
          AI CORE: <span className="text-on-surface">"Optimizing investment allocation."</span>
        </p>
      </header>

      {/* Add Form Trigger */}
      <div className="text-right mb-6">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-primary font-headline text-xs tracking-widest uppercase hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(129,236,255,0.15)]">
          {showForm ? 'Cancel Entry' : '+ Add Asset'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-panel rounded-2xl p-6 mb-8 border border-secondary/30 grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text"
              placeholder="Investment Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
            >
              {investmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount Invested"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
            />
            <input
              type="number"
              placeholder="Current Value (optional)"
              value={formData.currentValue}
              onChange={(e) => setFormData((prev) => ({ ...prev, currentValue: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
            />
            <div className="md:col-span-2 text-right">
              <button onClick={handleAddInvestment} className="px-6 py-3 bg-primary text-surface-lowest font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(129,236,255,0.4)]">
                Deploy Capital
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Portfolio Visualization (Chart) */}
        <div className="md:col-span-8 glass-panel rounded-xl p-8 relative overflow-hidden h-[400px]">
          <div className="absolute top-4 left-6 z-10">
            <h2 className="font-headline text-xs tracking-[0.2em] text-outline uppercase mb-1">Growth Telemetry</h2>
            <div className="text-2xl font-headline text-on-surface">Dynamic Yield Curve</div>
            <div className="text-xs text-primary mt-1 pr-6 drop-shadow-[0_0_5px_#81ecff]">
              Total Invested: {formatCurrency(stats.totalInvested)}
            </div>
          </div>
          
          {/* SVG Chart Mockup */}
          <div className="absolute inset-0 flex items-end px-0 pointer-events-none">
            <svg className="w-full h-full opacity-60" viewBox="0 0 1000 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:"rgba(129, 236, 255, 0.4)", stopOpacity:0.3}}></stop>
                  <stop offset="100%" style={{stopColor:"rgba(129, 236, 255, 0)", stopOpacity:0}}></stop>
                </linearGradient>
              </defs>
              <path d="M0,350 Q100,320 200,330 T400,280 T600,250 T800,180 T1000,120 L1000,400 L0,400 Z" fill="url(#chartGradient)"></path>
              <path className="neon-text-cyan" d="M0,350 Q100,320 200,330 T400,280 T600,250 T800,180 T1000,120" fill="none" stroke="#81ecff" strokeLinecap="round" strokeWidth="3"></path>
              <circle cx="1000" cy="120" fill="#81ecff" r="4"></circle>
              <circle className="animate-pulse" cx="1000" cy="120" fill="none" r="10" stroke="#81ecff" strokeWidth="1"></circle>
            </svg>
          </div>
          
          {/* HUD Overlays */}
          <div className="absolute bottom-6 left-6 grid grid-cols-3 gap-8 pointer-events-none">
            <div>
              <div className="text-[10px] text-outline font-label tracking-widest mb-1">VOLATILITY</div>
              <div className="text-on-surface font-headline">0.42%</div>
            </div>
            <div>
              <div className="text-[10px] text-outline font-label tracking-widest mb-1">SHARPE</div>
              <div className="text-on-surface font-headline">3.18</div>
            </div>
            <div>
              <div className="text-[10px] text-outline font-label tracking-widest mb-1">BETA</div>
              <div className="text-on-surface font-headline">0.84</div>
            </div>
          </div>
        </div>

        {/* Asset Allocation Cards */}
        <div className="md:col-span-4 flex flex-col gap-4">
          {investments.length === 0 ? (
            <div className="glass-panel p-6 rounded-xl flex items-center justify-center h-full text-outline font-label uppercase tracking-widest text-sm text-center">
              No Asset Data Found
            </div>
          ) : (
            investments.slice(0, 3).map((inv, idx) => {
              const theme = getStyleForIndex(idx);
              const gain = inv.currentValue - inv.amount;
              const gPercent = inv.amount > 0 ? (gain / inv.amount) * 100 : 0;
              return (
                <div key={inv.id || idx} className={`glass-panel rounded-xl p-5 group hover:border-${theme}/40 transition-all cursor-pointer`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg bg-${theme}/10 text-${theme}`}>
                      <span className="material-symbols-outlined whitespace-nowrap overflow-hidden">monitoring</span>
                    </div>
                    <span className={`font-headline text-[10px] tracking-widest text-${theme} bg-${theme}/10 px-2 py-0.5 rounded truncate max-w-[100px]`}>
                      {inv.type}
                    </span>
                  </div>
                  <div className="text-on-surface font-headline text-xl mb-1">{formatCurrency(inv.currentValue)}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-outline truncate mr-2">{inv.name}</span>
                    <span className={`text-xs ${gain >= 0 ? `text-${theme}-fixed drop-shadow-[0_0_3px_currentColor]` : 'text-error'}`}>
                      {gain >= 0 ? '+' : ''}{gPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Asymmetric Detail Section */}
      <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="font-headline text-2xl tracking-tight text-on-surface mb-6">Execution Logs</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border-l-2 border-primary">
              <span className="material-symbols-outlined text-primary">auto_graph</span>
              <div>
                <div className="text-sm font-headline text-on-surface">Auto-Rebalance Executed</div>
                <div className="text-[10px] text-outline font-label uppercase">TS: 08:22:14 UTC // 4 assets shifted</div>
              </div>
              <span className="ml-auto text-xs text-primary-fixed drop-shadow-[0_0_3px_#00e3fd]">SUCCESS</span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border-l-2 border-secondary/40">
              <span className="material-symbols-outlined text-secondary">shield_with_heart</span>
              <div>
                <div className="text-sm font-headline text-on-surface">Risk Threshold Secured</div>
                <div className="text-[10px] text-outline font-label uppercase">Drawdown capped at 2.5%</div>
              </div>
              <span className="ml-auto text-xs text-outline">STABLE</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl relative">
          <div className="absolute top-0 right-0 p-2 overflow-hidden">
            <div className="w-12 h-12 border-t border-r border-primary/30 rounded-tr-xl"></div>
          </div>
          <h3 className="font-headline text-xl text-on-surface mb-4">Capital Health Index</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle className="text-surface-variant" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary" style={{filter: "drop-shadow(0 0 5px #81ecff)"}} cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="91.1" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline text-2xl text-on-surface">75%</span>
                <span className="text-[8px] text-outline uppercase font-label">Optimum</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-outline">Liquidity</span>
                <span className="text-on-surface">88%</span>
              </div>
              <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                <div className="w-[88%] h-full bg-primary"></div>
              </div>
              <div className="flex justify-between text-xs pt-2">
                <span className="text-outline">Tax Efficiency</span>
                <span className="text-on-surface">94%</span>
              </div>
              <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                <div className="w-[94%] h-full bg-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
