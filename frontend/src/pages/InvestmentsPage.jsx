import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';
import fridayAPI from '../services/api';
import { PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { mcpService } from '../services/MCPService';

export const InvestmentsPage = () => {
  const store = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [chartRange, setChartRange] = useState('1M');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [mcpInsight, setMcpInsight] = useState(null);
  const [syncingGroww, setSyncingGroww] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Equity',
    type: 'SIP',
    amount: '',
    startDate: '',
    linkedToSalary: false,
  });

  const [marketFeed, setMarketFeed] = useState({
    nifty: null,
    sensex: null,
    isLoading: false,
    isStale: false,
    error: false,
  });

  const [goalProgress, setGoalProgress] = useState({ percentage: 0, target: 0, current: 0 });

  // 1. Fetch investments and live feed on mount
  useEffect(() => {
    const initData = async () => {
      // Fetch investments
      const res = await store.fetchInvestments?.();
      
      // Auto-sync from mock Groww MCP if holdings are empty on first load
      if (res && (!res.investments || res.investments.length === 0)) {
        try {
          setSyncingGroww(true);
          await store.syncGrowwPortfolio?.();
        } catch (e) {
          console.error("Auto-sync failed:", e);
        } finally {
          setSyncingGroww(false);
        }
      }
    };
    
    initData();

    // Fetch live market feed
    const fetchMarketFeed = async () => {
      setMarketFeed(prev => ({ ...prev, isLoading: true, error: false }));

      const fetchOne = async (symbol) => {
        try {
          const res = await fridayAPI.getMarketQuote(symbol);
          return { data: res.quote, stale: res.stale || false };
        } catch {
          return { data: null, stale: false };
        }
      };

      const [niftyResult, sensexResult] = await Promise.all([
        fetchOne('NSEI'),
        fetchOne('BSESN'),
      ]);

      const anyStale = niftyResult.stale || sensexResult.stale;

      setMarketFeed({
        nifty: niftyResult.data,
        sensex: sensexResult.data,
        isLoading: false,
        isStale: anyStale,
        error: !niftyResult.data && !sensexResult.data,
      });
    };

    fetchMarketFeed();
  }, []);

  // 2. Fetch Goal Progress from localStorage
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem('friday_goals');
      if (savedGoals) {
        const goalsList = JSON.parse(savedGoals);
        if (goalsList && goalsList.length > 0) {
          const totalTarget = goalsList.reduce((sum, g) => sum + g.target, 0);
          const totalCurrent = goalsList.reduce((sum, g) => sum + g.current, 0);
          const pct = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
          setGoalProgress({ percentage: pct, target: totalTarget, current: totalCurrent });
        } else {
          setGoalProgress({ percentage: 0, target: 0, current: 0 });
        }
      } else {
        setGoalProgress({ percentage: 0, target: 0, current: 0 });
      }
    } catch (e) {
      console.error("Failed to parse goals:", e);
    }
  }, [store.investments]);

  // 3. Fetch dynamic AI/MCP Insight
  useEffect(() => {
    if (store.investments && store.investments.length > 0) {
      mcpService.queryGrowPortfolio(store.investments).then(res => {
        setMcpInsight(res?.recommendation || null);
      });
    } else {
      setMcpInsight(null);
    }
  }, [store.investments]);

  const getCategory = (type) => {
    const t = type?.toLowerCase();
    if (t === 'equity' || t === 'stock' || t === 'elss' || t === 'mutual_fund' || t === 'etf' || t === 'sip') return 'Equity';
    if (t === 'debt' || t === 'fd' || t === 'ppf' || t === 'nps') return 'Debt';
    if (t === 'gold') return 'Gold';
    if (t === 'liquid' || t === 'cash') return 'Liquid';
    return 'Equity';
  };

  const stats = store.portfolioStats || { totalInvested: 0, currentValue: 0, totalGain: 0, gainPercent: 0 };
  const databaseInvestments = store.investments || [];

  const holdings = databaseInvestments.map((inv, idx) => {
    const gain = inv.currentValue - inv.investedAmount;
    const gPercent = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'account_balance_wallet' },
      { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'trending_up' },
      { bg: 'bg-[#FFB038]/10', text: 'text-[#92600A]', icon: 'pie_chart' },
      { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'payments' }
    ];
    const style = colors[idx % colors.length];
    return {
      id: inv._id || inv.id,
      name: inv.name,
      type: getCategory(inv.type),
      investType: inv.sipDetails?.monthlyAmount > 0 ? 'SIP' : 'Lumpsum',
      amount: inv.investedAmount,
      currentValue: inv.currentValue,
      subType: `Direct • ${inv.type}`,
      colorBg: style.bg,
      colorText: style.text,
      icon: style.icon,
      gain,
      gainPercent: gPercent,
      isSipActive: inv.sipDetails?.monthlyAmount > 0,
      sipAmount: inv.sipDetails?.monthlyAmount || 0,
      sipNextDate: inv.sipDetails?.nextDate,
    };
  });

  const totalValue = stats.currentValue ?? 0;
  const totalInvested = stats.totalInvested ?? 0;
  const totalGains = stats.totalGain ?? (totalValue - totalInvested);
  const gainPercent = parseFloat(stats.gainPercent || 0);

  // Calculate distribution split: Equity / Debt / Gold / Liquid
  const distributionData = holdings.reduce((acc, current) => {
    const cat = current.type;
    const existing = acc.find(item => item.name === cat);
    if (existing) {
      existing.value += current.currentValue;
    } else {
      acc.push({ name: cat, value: current.currentValue });
    }
    return acc;
  }, []);

  const ASSET_COLORS = {
    Equity: '#1A56F5',
    Debt: '#FFB038',
    Gold: '#FF2D55',
    Liquid: '#34C759',
    Other: '#8E8E93'
  };

  const getAssetColor = (name) => ASSET_COLORS[name] || ASSET_COLORS.Other;

  // Donut click toggles category filtering
  const handleDonutSliceClick = (data) => {
    const clickedCat = data.name;
    setSelectedCategoryFilter(prev => prev === clickedCat ? null : clickedCat);
  };

  // Filtered holdings list
  const filteredHoldings = holdings.filter(h => {
    if (!selectedCategoryFilter) return true;
    return h.type === selectedCategoryFilter;
  });

  const handleConnectGroww = async () => {
    try {
      setSyncingGroww(true);
      await store.syncGrowwPortfolio?.();
    } catch (e) {
      alert("Failed to sync Groww portfolio. Please try again.");
    } finally {
      setSyncingGroww(false);
    }
  };

  const handleAddHolding = async () => {
    if (formData.name && formData.amount) {
      const amt = parseInt(formData.amount);
      const isSip = formData.type === 'SIP';
      
      const payload = {
        name: formData.name,
        type: formData.category,
        investedAmount: amt,
        currentValue: amt,
        sipDetails: {
          startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
          monthlyAmount: isSip ? amt : undefined,
          nextDate: isSip ? (formData.startDate ? new Date(new Date(formData.startDate).setMonth(new Date(formData.startDate).getMonth() + 1)) : new Date(new Date().setDate(new Date().getDate() + 10))) : undefined,
        },
        tags: formData.linkedToSalary ? ["linked_to_salary"] : [],
      };
      
      try {
        await store.addInvestment(payload);
        setFormData({ name: '', category: 'Equity', type: 'SIP', amount: '', startDate: '', linkedToSalary: false });
        setShowForm(false);
      } catch (e) {
        console.error("Error adding investment:", e);
      }
    }
  };

  // SIP auto-deduction calendar items
  const activeSips = holdings.filter(h => h.isSipActive);
  const sipCalendarItems = activeSips.map(s => {
    const nextDate = s.sipNextDate ? new Date(s.sipNextDate) : new Date();
    return {
      name: s.name,
      amount: s.sipAmount,
      day: nextDate.getDate(),
      dateStr: nextDate.toLocaleDateString('default', { day: 'numeric', month: 'short' }),
    };
  }).sort((a, b) => a.day - b.day);

  // Dynamic seed-based chart generator to prevent flashing
  const generateChartData = (fund, range) => {
    const data = [];
    const points = range === '1M' ? 15 : range === '3M' ? 12 : 24;
    const startVal = fund.amount;
    const endVal = fund.currentValue;
    const diff = endVal - startVal;
    
    let seed = 0;
    const fundId = fund.id || "1";
    for (let i = 0; i < fundId.length; i++) {
      seed += fundId.charCodeAt(i);
    }
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < points; i++) {
      const pct = i / (points - 1);
      const base = startVal + diff * pct;
      const noise = base * (random() - 0.5) * 0.05 * (1 - pct);
      data.push({
        name: range === '1M' ? `Day ${i*2}` : range === '3M' ? `Wk ${i+1}` : `Mth ${i+1}`,
        value: Math.round(base + noise),
      });
    }
    return data;
  };

  const selectedChartData = selectedFund ? generateChartData(selectedFund, chartRange) : [];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center pb-32">
      {/* Top App Bar */}
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
            <h1 className="text-lg font-bold text-on-primary text-left">FRIDAY</h1>
          </div>
          <button className="text-on-primary opacity-70 hover:opacity-100 transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-md bg-surface min-h-screen pt-[72px] pb-32 flex flex-col items-stretch">
        {/* Portfolio Header */}
        <section className="bg-inverse-surface px-5 pt-6 pb-8 rounded-b-[40px] text-left">
          {/* Live Market Ticker */}
          <div className="flex gap-4 mb-6 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
            {marketFeed.isLoading ? (
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-primary/40 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                Syncing Live Indices...
              </div>
            ) : marketFeed.nifty || marketFeed.sensex ? (
              <>
                {marketFeed.nifty && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-on-primary/60 uppercase tracking-wider">{marketFeed.nifty.name}</span>
                    <span className="text-xs font-bold text-on-primary">{marketFeed.nifty.currentPrice.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold flex items-center ${marketFeed.nifty.changePercent >= 0 ? 'text-[#34C759]' : 'text-error'}`}>
                      <span className="material-symbols-outlined text-[14px]">{marketFeed.nifty.changePercent >= 0 ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
                      {marketFeed.nifty.changePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
                {marketFeed.sensex && (
                  <div className="flex items-center gap-1.5 shrink-0 border-l border-white/10 pl-4">
                    <span className="text-[10px] font-bold text-on-primary/60 uppercase tracking-wider">{marketFeed.sensex.name}</span>
                    <span className="text-xs font-bold text-on-primary">{marketFeed.sensex.currentPrice.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold flex items-center ${marketFeed.sensex.changePercent >= 0 ? 'text-[#34C759]' : 'text-error'}`}>
                      <span className="material-symbols-outlined text-[14px]">{marketFeed.sensex.changePercent >= 0 ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
                      {marketFeed.sensex.changePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
                {marketFeed.isStale && (
                  <div className="flex items-center gap-1 shrink-0 border-l border-white/10 pl-4 opacity-50">
                    <span className="material-symbols-outlined text-[12px] text-on-primary/40">schedule</span>
                    <span className="text-[9px] text-on-primary/40 uppercase font-bold tracking-wider">Delayed</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-on-primary/30 uppercase font-semibold">
                <span className="material-symbols-outlined text-[14px]">do_not_disturb_on</span>
                Market closed · data unavailable
              </div>
            )}
          </div>

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

          {/* Quick Stats Grid */}
          <div className="flex gap-4 mt-6 overflow-x-auto no-scrollbar">
            <div className="min-w-[130px] bg-white/10 p-3.5 rounded-xl border border-white/5 text-left">
              <p className="text-[10px] font-semibold text-on-primary opacity-50 mb-0.5">INVESTED</p>
              <p className="text-sm font-bold text-on-primary">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="min-w-[130px] bg-white/10 p-3.5 rounded-xl border border-white/5 text-left">
              <p className="text-[10px] font-semibold text-on-primary opacity-50 mb-0.5">TOTAL GAINS</p>
              <p className="text-sm font-bold text-tertiary-fixed">{totalGains >= 0 ? '+' : ''}{formatCurrency(totalGains)}</p>
            </div>
            <div className="min-w-[130px] bg-white/10 p-3.5 rounded-xl border border-white/5 text-left">
              <p className="text-[10px] font-semibold text-on-primary opacity-50 mb-0.5">ACTIVE ASSETS</p>
              <p className="text-sm font-bold text-on-primary">{holdings.length} Funds</p>
            </div>
          </div>

          {/* Goal Progress Bar */}
          {goalProgress.target > 0 && (
            <div className="mt-5 space-y-2 border-t border-white/5 pt-4">
              <div className="flex justify-between items-baseline text-[10px] text-on-primary uppercase tracking-wider font-semibold">
                <span className="opacity-70">Goal progress</span>
                <span className="text-tertiary-fixed font-bold">{goalProgress.percentage}% completed</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.3)] transition-all duration-500" 
                  style={{ width: `${goalProgress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Dynamic AI Insights Banner */}
        {mcpInsight && (
          <div className="px-5 -mt-6">
            <div className="bg-primary-container p-4 rounded-2xl flex items-start gap-3 shadow-lg text-left relative overflow-hidden group">
              <span className="material-symbols-outlined text-on-primary-container shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className="text-xs text-on-primary-container leading-relaxed z-10">{mcpInsight}</p>
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>
          </div>
        )}

        {/* Holdings Distribution Chart Card */}
        {holdings.length > 0 && (
          <section className="px-5 mt-6 text-left">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border-[0.5px] border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Asset Allocation</h3>
                {selectedCategoryFilter && (
                  <button 
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-[9px] font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-primary/10"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-4">
                {/* Donut Chart */}
                <div className="w-[140px] h-[140px] relative shrink-0">
                  <PieChart width={140} height={140}>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={handleDonutSliceClick}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getAssetColor(entry.name)} 
                          className="cursor-pointer hover:opacity-85 transition-opacity"
                          stroke={selectedCategoryFilter === entry.name ? '#000' : 'none'}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Value']} 
                      contentStyle={{ 
                        backgroundColor: 'rgba(13, 19, 38, 0.95)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        fontSize: '10px', 
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                    <span className="text-[8px] font-semibold text-outline uppercase tracking-wider">Total</span>
                    <span className="text-xs font-black text-on-surface">₹{Math.round(totalValue).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-grow flex flex-col gap-2">
                  {distributionData.map((item) => {
                    const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                    const isSelected = selectedCategoryFilter === item.name;
                    return (
                      <div 
                        key={item.name} 
                        onClick={() => handleDonutSliceClick(item)}
                        className={`flex items-center justify-between text-xs cursor-pointer p-1 rounded transition-colors ${isSelected ? 'bg-surface-container' : 'hover:bg-surface-container/50'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: getAssetColor(item.name) }} 
                          />
                          <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-on-surface">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SIP Calendar */}
        {sipCalendarItems.length > 0 && (
          <section className="px-5 mt-6 text-left">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border-[0.5px] border-outline-variant/30 shadow-sm">
              <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">SIP Calendar</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {sipCalendarItems.map((item, idx) => (
                  <div 
                    key={`${item.name}-${idx}`}
                    className="min-w-[100px] bg-background border border-outline-variant/35 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                      Day {item.day}
                    </span>
                    <p className="text-xs font-bold text-on-surface truncate w-full">{item.name.split(' ')[0]}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Holdings List */}
        <section className="px-5 mt-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">YOUR HOLDINGS</h3>
              {selectedCategoryFilter && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedCategoryFilter}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {holdings.length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to clear all your investments? This will wipe your portfolio back to ₹0.")) {
                      await store.clearAllInvestments();
                    }
                  }}
                  className="text-[10px] font-bold text-error uppercase tracking-wider hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">restart_alt</span>
                  Reset Portfolio
                </button>
              )}
              <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">filter_list</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {holdings.length === 0 ? (
              /* Illustrated Empty State */
              <div className="bg-surface-container-lowest p-6 rounded-2xl border-[0.5px] border-outline-variant/30 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
                  <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Vault Offline</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-[240px] mb-5">
                  Connect your Groww or Zerodha account to sync your active mutual funds, gold, and stocks instantly.
                </p>
                <button
                  onClick={handleConnectGroww}
                  disabled={syncingGroww}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  {syncingGroww ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm animate-spin">autorenew</span>
                      Syncing Portfolio...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">link</span>
                      Connect Groww Account
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Add manually
                </button>
              </div>
            ) : filteredHoldings.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-xs uppercase tracking-widest font-semibold bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl">
                No active holdings matching "{selectedCategoryFilter}"
              </div>
            ) : (
              filteredHoldings.map((h) => {
                const gain = h.gain;
                const gPercent = h.gainPercent;
                const isPositive = gain >= 0;

                return (
                  <div 
                    key={h.id} 
                    onClick={() => { setSelectedFund(h); setChartRange('1M'); }}
                    className="bg-surface-container-lowest p-4 rounded-xl border-[0.5px] border-outline-variant/30 transition-transform active:scale-[0.99] hover:shadow-sm cursor-pointer text-left"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${h.colorBg} rounded-lg flex items-center justify-center shrink-0`}>
                          <span className={`material-symbols-outlined ${h.colorText}`}>{h.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{h.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">{h.subType}</span>
                            {h.isSipActive && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase tracking-wider">
                                <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse"></span>
                                SIP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
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
              })
            )}
          </div>
        </section>

        {/* Add Asset trigger FAB */}
        <div className="fixed bottom-24 left-0 w-full px-5 z-30 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button 
              onClick={() => setShowForm(true)} 
              className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:brightness-110"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add Asset
            </button>
          </div>
        </div>
      </main>

      {/* Fund Details Modal */}
      <AnimatePresence>
        {selectedFund && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-2xl relative text-left max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 pr-4">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                    {selectedFund.type}
                  </span>
                  <h3 className="text-base font-bold text-on-surface font-headline leading-tight mt-1 truncate">{selectedFund.name}</h3>
                  <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">{selectedFund.subType}</p>
                </div>
                <button
                  onClick={() => setSelectedFund(null)}
                  className="text-outline hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Chart Section */}
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Historical Performance</span>
                  <div className="flex gap-1.5 bg-background p-0.5 rounded-lg border border-outline-variant/30">
                    {['1M', '3M', '1Y'].map(range => (
                      <button
                        key={range}
                        onClick={() => setChartRange(range)}
                        className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md uppercase transition-colors ${chartRange === range ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A56F5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1A56F5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#8E8E93' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: '#8E8E93' }} axisLine={false} tickLine={false} domain={['dataMin - 1000', 'dataMax + 1000']} />
                      <Tooltip 
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(13, 19, 38, 0.95)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '8px', 
                          fontSize: '10px', 
                          color: '#fff',
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#1A56F5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fund Stats Table */}
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background p-3 rounded-xl border border-outline-variant/20">
                    <span className="block text-[9px] font-bold text-outline uppercase tracking-wider">Invested Value</span>
                    <span className="block text-sm font-bold text-on-surface mt-1">{formatCurrency(selectedFund.amount)}</span>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-outline-variant/20">
                    <span className="block text-[9px] font-bold text-outline uppercase tracking-wider">Current Value</span>
                    <span className="block text-sm font-bold text-on-surface mt-1">{formatCurrency(selectedFund.currentValue)}</span>
                  </div>
                </div>

                <div className="bg-background p-3.5 rounded-xl border border-outline-variant/20 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-on-surface-variant">Absolute Return</span>
                    <span className={`font-bold ${selectedFund.gain >= 0 ? 'text-tertiary' : 'text-error'}`}>
                      {selectedFund.gain >= 0 ? '+' : ''}{formatCurrency(selectedFund.gain)} ({selectedFund.gainPercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-outline-variant/20 pt-2">
                    <span className="font-semibold text-on-surface-variant">Annualized IRR (Est)</span>
                    <span className="font-bold text-tertiary">14.8% per annum</span>
                  </div>
                  {selectedFund.isSipActive && (
                    <div className="flex justify-between items-center text-xs border-t border-outline-variant/20 pt-2">
                      <span className="font-semibold text-on-surface-variant">Monthly SIP Amount</span>
                      <span className="font-bold text-primary">{formatCurrency(selectedFund.sipAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this asset from your portfolio tracker?")) {
                      await fridayAPI.del(`/investments/${selectedFund.id}`);
                      await store.fetchInvestments?.();
                      setSelectedFund(null);
                    }
                  }}
                  className="flex-1 py-3 text-xs font-bold text-error bg-error/5 border border-error/20 hover:bg-error/10 rounded-xl transition-all text-center"
                >
                  Delete Asset
                </button>
                <button
                  onClick={() => setSelectedFund(null)}
                  className="flex-1 py-3 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-center"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-on-surface font-headline uppercase tracking-wider">Add Investment</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-outline hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-wider ml-1">Asset Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Axis Bluechip Fund"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-outline-variant/35 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-wider ml-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-outline-variant/35 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                    >
                      <option value="Equity">Equity</option>
                      <option value="Debt">Debt</option>
                      <option value="Gold">Gold</option>
                      <option value="Liquid">Liquid</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-wider ml-1">Investment Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-outline-variant/35 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                    >
                      <option value="SIP">SIP (Recurring)</option>
                      <option value="Lumpsum">Lumpsum (One-time)</option>
                      <option value="Stock">Direct Stock</option>
                      <option value="Gold">Physical Gold</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-wider ml-1">Invested Amount</label>
                    <input
                      type="number"
                      placeholder="₹5,000"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-outline-variant/35 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-outline uppercase tracking-wider ml-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-outline-variant/35 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                    />
                  </div>
                </div>

                {/* Linked to Salary Toggle */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <div>
                    <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">Link to monthly salary</span>
                    <span className="block text-[9px] text-on-surface-variant font-medium mt-0.5">Deduct automatically when salary credits</span>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, linkedToSalary: !prev.linkedToSalary }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${formData.linkedToSalary ? 'bg-primary' : 'bg-outline-variant'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.linkedToSalary ? 'translate-x-4.5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowForm(false)} 
                    className="flex-1 py-3 text-xs font-bold text-on-surface-variant bg-white border border-outline-variant/35 rounded-xl hover:bg-surface-container transition-all active:scale-[0.98] text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddHolding}
                    className="flex-1 py-3 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 transition-all active:scale-[0.98] text-center shadow-md shadow-primary/10"
                  >
                    Add Asset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
