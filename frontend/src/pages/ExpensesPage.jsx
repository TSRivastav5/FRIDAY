import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency, formatDateShort } from '../utils/helpers';
import { expenseCategories } from '../data/mockData';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ExpensesPage = () => {
  const store = useFinanceStore();
  
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null); // 'emi' | 'rent' | 'sip' | 'travel' | 'bills'
  const [editValue, setEditValue] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: 'Food', amount: '', description: '' });

  // 1. Fetch Salary History & Expenses on mount
  useEffect(() => {
    store.fetchSalaryHistory?.();
    store.fetchExpenses?.();
  }, []);

  const salaryHistory = store.salaryHistory || [];
  const profile = store.user?.financialProfile || {};

  // Find the selected salary object
  const selectedSalary = salaryHistory.find(s => s._id === selectedSalaryId) || null;
  const currentMonthSalaryIndex = selectedSalary 
    ? salaryHistory.findIndex(s => s._id === selectedSalaryId) 
    : -1;

  // Salary allocation breakdown values (fallback to profile defaults if not set in salary record)
  const salaryAmount = selectedSalary?.amount || 0;
  const emi = selectedSalary ? (selectedSalary.allocation?.emi ?? profile.fixedExpenses?.emiDefault ?? 0) : 0;
  const rent = selectedSalary ? (selectedSalary.allocation?.rent ?? profile.fixedExpenses?.rent ?? 0) : 0;
  const sip = selectedSalary ? (selectedSalary.allocation?.sip ?? profile.sipDefault ?? 0) : 0;
  const travel = selectedSalary ? (selectedSalary.allocation?.travel ?? profile.travelDefault ?? 0) : 0;
  const bills = selectedSalary ? (selectedSalary.allocation?.bills ?? profile.billsDefault ?? 0) : 0;
  
  const totalAllocated = emi + rent + sip + travel + bills;
  const youKeep = salaryAmount - totalAllocated;

  // Verify whether category is set anywhere (either in this allocation or profile settings)
  const isCategoryConfigured = (category) => {
    if (category === 'emi') return emi > 0;
    if (category === 'rent') return rent > 0;
    if (category === 'sip') return sip > 0;
    if (category === 'travel') return travel > 0;
    if (category === 'bills') return bills > 0;
    return false;
  };

  // Checkbox toggle logic
  const handleTogglePaid = async (category) => {
    if (!selectedSalary) return;
    const isPaid = selectedSalary.paidAllocations?.includes(category);
    let newPaidList = selectedSalary.paidAllocations || [];
    
    if (isPaid) {
      newPaidList = newPaidList.filter(c => c !== category);
    } else {
      newPaidList = [...newPaidList, category];
    }

    try {
      await store.updateSalaryAllocation(selectedSalary._id, selectedSalary.allocation, newPaidList);
    } catch (e) {
      console.error("Failed to toggle paid status:", e);
    }
  };

  // Inline edit override logic
  const handleStartEdit = (category, value) => {
    setEditingCategory(category);
    setEditValue(value.toString());
  };

  const handleSaveEdit = async () => {
    if (!selectedSalary) return;
    const newVal = parseInt(editValue, 10);
    if (isNaN(newVal) || newVal < 0) {
      alert("Please enter a valid amount");
      return;
    }

    const updatedAlloc = {
      ...(selectedSalary.allocation || {}),
      [editingCategory]: newVal
    };

    // Calculate dynamic remaining
    const tempEmi = updatedAlloc.emi ?? emi;
    const tempRent = updatedAlloc.rent ?? rent;
    const tempSip = updatedAlloc.sip ?? sip;
    const tempTravel = updatedAlloc.travel ?? travel;
    const tempBills = updatedAlloc.bills ?? bills;
    updatedAlloc.remaining = salaryAmount - (tempEmi + tempRent + tempSip + tempTravel + tempBills);

    try {
      await store.updateSalaryAllocation(selectedSalary._id, updatedAlloc, selectedSalary.paidAllocations);
      setEditingCategory(null);
    } catch (e) {
      console.error("Failed to save allocation edit:", e);
    }
  };

  // Route View Recommendation CTA link to Ask AI tab
  const handleViewRecommendation = () => {
    if (!selectedSalary) return;
    const recommendationText = selectedSalary.aiAnalysis?.insights?.[0] || "Provide feedback on my current monthly surplus allocation.";
    store.setPreloadedAiMessage(`Explain the advice: "${recommendationText}"`);
    store.setActiveTab('ask_ai');
  };

  // Month navigation (swiping chronologically)
  const handlePrevMonth = () => {
    if (currentMonthSalaryIndex < salaryHistory.length - 1) {
      setSelectedSalaryId(salaryHistory[currentMonthSalaryIndex + 1]._id);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthSalaryIndex > 0) {
      setSelectedSalaryId(salaryHistory[currentMonthSalaryIndex - 1]._id);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (window.confirm("Are you sure you want to delete this salary entry? All allocations for this month will be removed.")) {
      try {
        await store.deleteSalary(id);
      } catch (err) {
        alert("Failed to delete salary: " + err.message);
      }
    }
  };

  // Convert "2026-05" database string into readable long dates (e.g. "May 2026")
  const getMonthYearString = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Filter ledger and category charts to show ONLY items matching the selected month!
  const allExpenses = store.expenses || [];
  const monthlyExpenses = selectedSalary
    ? allExpenses.filter(e => e.date?.startsWith(selectedSalary.month))
    : allExpenses;

  const totalMonthlyLedger = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const allocationChartData = [
    { name: 'EMI', value: emi, color: '#FF3B30' },
    { name: 'Rent', value: rent, color: '#5856D6' },
    { name: 'SIP', value: sip, color: '#34C759' },
    { name: 'Travel', value: travel, color: '#007AFF' },
    { name: 'Bills', value: bills, color: '#8E8E93' },
    { name: 'Surplus', value: Math.max(0, youKeep), color: '#34C759' }
  ].filter(item => item.value > 0);

  const categoryColors = {
    Food: '#FF9500',
    Travel: '#007AFF',
    Shopping: '#FF2D55',
    Entertainment: '#5856D6',
    Bills: '#FFCC00',
    Health: '#34C759',
    Education: '#5AC8FA',
    Other: '#8E8E93'
  };

  const categoryTotals = monthlyExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const barChartData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    amount: categoryTotals[cat]
  }));

  const handleAddExpense = async () => {
    if (formData.amount && selectedSalary) {
      try {
        // Set date to current day if the selected month is the current system month,
        // otherwise default to the 15th of the historical month.
        const currentMonthStr = new Date().toISOString().split('T')[0].slice(0, 7);
        const isCurrentMonth = selectedSalary.month === currentMonthStr;
        const dateString = isCurrentMonth 
          ? new Date().toISOString().split('T')[0]
          : `${selectedSalary.month}-15`;

        await store.addExpense({
          category: formData.category,
          amount: parseInt(formData.amount),
          description: formData.description || formData.category,
          date: dateString,
        });
        setFormData({ category: 'Food', amount: '', description: '' });
        setShowForm(false);
      } catch (e) {
        console.error("Error adding expense:", e);
      }
    }
  };

  const categoryEmojis = { 
    Food: 'restaurant', 
    Travel: 'flight_takeoff', 
    Shopping: 'local_mall', 
    Entertainment: 'movie', 
    Bills: 'receipt_long', 
    Health: 'medical_services', 
    Education: 'school', 
    Other: 'category' 
  };

  // ────────────────────────────────────────────────────────
  // RENDER DETAILED ALLOCATION VIEW (If month selected)
  // ────────────────────────────────────────────────────────
  if (selectedSalary) {
    const paidList = selectedSalary.paidAllocations || [];
    const monthLabel = getMonthYearString(selectedSalary.month);

    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center pb-32">
        {/* Header Section (Dark Navy) with back action and month picker */}
        <header className="bg-inverse-surface w-full z-10 pt-12 pb-16 px-5 rounded-b-[40px] text-on-primary text-left">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setSelectedSalaryId(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-on-primary">arrow_back</span>
              </button>
              
              {/* Swipe Month Selector */}
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentMonthSalaryIndex === salaryHistory.length - 1}
                  onClick={handlePrevMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-20 transition-all text-on-primary"
                >
                  <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                </button>
                <h1 className="text-xs font-black uppercase tracking-widest text-on-primary">{monthLabel}</h1>
                <button 
                  disabled={currentMonthSalaryIndex === 0}
                  onClick={handleNextMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-20 transition-all text-on-primary"
                >
                  <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                </button>
              </div>
              
              <div className="w-10 h-10"></div> {/* Spacer */}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-on-primary/60 uppercase tracking-wider">Credited amount</p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-on-primary">{formatCurrency(salaryAmount)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed font-variation-settings-['FILL'_1]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="text-xs text-tertiary-fixed">Verified · HDFC Bank</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full max-w-md px-5 -mt-8 relative z-20 flex flex-col items-stretch">
          
          {/* Section Title */}
          <div className="mb-4 flex justify-between items-center text-left">
            <h2 className="text-lg font-bold text-on-surface">Where it goes</h2>
          </div>

          {/* Breakdown Card */}
          <div className="bg-surface-container-lowest rounded-xl border-[0.5px] border-outline-variant/30 shadow-sm overflow-hidden text-left">
            <div className="p-5 flex flex-col items-center gap-6 border-b border-outline-variant/20">
              
              {/* Donut Chart */}
              {allocationChartData.length > 0 && (
                <div className="w-[130px] h-[130px] relative shrink-0">
                  <PieChart width={130} height={130}>
                    <Pie
                      data={allocationChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Allocated']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(13, 19, 38, 0.95)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        fontSize: '10px', 
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                    <span className="text-[8px] font-semibold text-outline uppercase tracking-wider">Salary</span>
                    <span className="text-[11px] font-black text-on-surface">₹{(salaryAmount / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              )}

              {/* Breakdown Rows with Mark as Paid and Inline Edit */}
              <div className="w-full space-y-4">
                {[
                  { label: 'EMI Commitments', key: 'emi', value: emi, color: 'bg-[#FF3B30]' },
                  { label: 'House Rent', key: 'rent', value: rent, color: 'bg-[#5856D6]' },
                  { label: 'SIP Investments', key: 'sip', value: sip, color: 'bg-[#34C759]' },
                  { label: 'Travel Budget', key: 'travel', value: travel, color: 'bg-[#FF2D55]' },
                  { label: 'Bills & Utilities', key: 'bills', value: bills, color: 'bg-[#8E8E93]' }
                ].map(({ label, key, value, color }) => {
                  const isPaid = paidList.includes(key);
                  const isConfigured = isCategoryConfigured(key);
                  const isEditing = editingCategory === key;

                  return (
                    <div key={key} className="flex items-center justify-between gap-2.5">
                      
                      {/* Left side: dot, title, checkbox */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isConfigured && (
                          <input 
                            type="checkbox"
                            checked={isPaid}
                            onChange={() => handleTogglePaid(key)}
                            className="w-4.5 h-4.5 text-primary border-outline-variant/30 rounded focus:ring-primary focus:ring-0 cursor-pointer"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`}></div>
                          <span className={`text-sm font-semibold text-on-surface ${isPaid ? 'line-through opacity-50' : ''}`}>
                            {label}
                          </span>
                        </div>
                      </div>

                      {/* Right side: Amount value or Paid status */}
                      <div className="flex items-center gap-1.5 text-right min-w-0 flex-grow justify-end">
                        {!isConfigured ? (
                          <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
                            Not set · <button onClick={() => store.setActiveTab('profile')} className="text-primary font-bold hover:underline">Set up →</button>
                          </span>
                        ) : isPaid ? (
                          <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Paid ✓
                          </span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input 
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 px-1.5 py-0.5 border border-primary rounded text-xs bg-background font-bold text-on-surface"
                            />
                            <button 
                              onClick={handleSaveEdit}
                              className="p-1 rounded bg-[#34C759] text-white hover:opacity-90 flex items-center justify-center shrink-0"
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                            </button>
                            <button 
                              onClick={() => setEditingCategory(null)}
                              className="p-1 rounded bg-error text-white hover:opacity-90 flex items-center justify-center shrink-0"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm font-bold text-on-surface truncate">
                              -{formatCurrency(value)}
                            </span>
                            <button 
                              onClick={() => handleStartEdit(key, value)}
                              className="text-on-surface-variant/40 hover:text-primary transition-colors flex items-center justify-center shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-tertiary-fixed/20 p-4 flex justify-between items-center">
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">You keep (Surplus)</span>
                <span className="text-base font-bold text-tertiary">{formatCurrency(youKeep)}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation Insight Chip */}
          <div className="mt-6 bg-primary-fixed/30 rounded-xl p-4 border border-primary-fixed/50 flex gap-4 text-left">
            <div className="mt-1">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-on-background leading-relaxed">
                {selectedSalary.aiAnalysis?.insights?.[0] || "Your monthly allocation is calibrated. Check Ask AI for further financial tips based on this data!"}
              </p>
              <button 
                onClick={handleViewRecommendation}
                className="mt-2 text-primary text-[11px] font-bold flex items-center gap-1 group"
              >
                VIEW RECOMMENDATION
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Spending Category Chart */}
          {monthlyExpenses.length > 0 && (
            <section className="mt-6 text-left">
              <div className="bg-surface-container-lowest p-5 rounded-2xl border-[0.5px] border-outline-variant/30 shadow-sm">
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">Spending by Category</h3>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(13, 19, 38, 0.95)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '8px', 
                          fontSize: '10px', 
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="amount" fill="#1A56F5" radius={[4, 4, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#1A56F5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* Ledger Section */}
          <section className="mt-8 text-left">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">EXPENSE LEDGER</h3>
              <button 
                onClick={() => setShowForm(!showForm)} 
                className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-xl text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
                {showForm ? 'Cancel' : 'Add Expense'}
              </button>
            </div>

            {/* Add Expense Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  className="bg-surface-container-lowest p-4 rounded-xl border-[0.5px] border-outline-variant/30 space-y-3 mb-4 shadow-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background"
                  />
                  <button onClick={handleAddExpense} className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
                    Save Transaction
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ledger entries list */}
            <div className="space-y-3">
              {monthlyExpenses.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-xs uppercase tracking-widest font-semibold">No expenses tracked this month</div>
              ) : (
                monthlyExpenses.slice().reverse().map((expense) => (
                  <div key={expense._id || expense.id} className="bg-surface-container-lowest p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex items-center justify-between hover:border-primary transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {categoryEmojis[expense.category] || 'category'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">{expense.description || expense.category}</h4>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                          {expense.category} · {formatDateShort(expense.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-on-surface">-{formatCurrency(expense.amount)}</p>
                      <button 
                        onClick={() => store.deleteExpense(expense._id || expense.id)} 
                        className="text-[9px] font-bold text-error uppercase tracking-wider hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // RENDER MONTH CARDS HISTORY LIST (If no month selected)
  // ────────────────────────────────────────────────────────
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center pb-32">
      {/* Header Section (Dark Navy) */}
      <header className="bg-inverse-surface w-full z-10 pt-12 pb-12 px-5 rounded-b-[40px] text-on-primary text-left">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-on-primary">Allocation History</h1>
            <p className="text-xs text-on-primary/60 mt-1 uppercase tracking-wider font-semibold">Track past salary breakdowns</p>
          </div>
          <button 
            onClick={() => store.setSalaryModal(true)} 
            className="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20 active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add_card</span>
            Credit Salary
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md px-5 mt-6 relative z-20 flex flex-col items-stretch space-y-4">
        {salaryHistory.length === 0 ? (
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">account_balance_wallet</span>
            <p className="text-sm font-bold text-on-surface">No salary allocations recorded</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">Credit your first salary to start tracking rules</p>
            <button 
              onClick={() => store.setSalaryModal(true)}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Credit Salary Now
            </button>
          </div>
        ) : (
          salaryHistory.map((sal) => {
            const paidCount = sal.paidAllocations?.length || 0;
            const progressPercent = Math.round((paidCount / 5) * 100);
            
            const salEmi = sal.allocation?.emi ?? 0;
            const salRent = sal.allocation?.rent ?? 0;
            const salSip = sal.allocation?.sip ?? 0;
            const salTravel = sal.allocation?.travel ?? 0;
            const salBills = sal.allocation?.bills ?? 0;
            const salAllocated = salEmi + salRent + salSip + salTravel + salBills;
            const salSurplus = sal.amount - salAllocated;

            return (
              <div 
                key={sal._id} 
                onClick={() => setSelectedSalaryId(sal._id)}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/50 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.99] text-left flex flex-col gap-3.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-on-surface">{getMonthYearString(sal.month)}</h3>
                    <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider mt-0.5">Credited Salary</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-primary">{formatCurrency(sal.amount)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSalary(sal._id);
                      }}
                      className="p-1 rounded-lg text-outline hover:text-error hover:bg-error/5 transition-colors flex items-center justify-center shrink-0"
                      title="Delete salary record"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
                
                {/* Progress bar for paid status */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-on-surface-variant/60 uppercase tracking-wider">Commitments Progress</span>
                    <span className={progressPercent === 100 ? "text-[#34C759]" : "text-primary"}>{paidCount} / 5 Marked Paid</span>
                  </div>
                  <div className="w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${progressPercent === 100 ? 'bg-[#34C759]' : 'bg-primary'}`} 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1 border-t border-outline-variant/10 text-xs">
                  <span className="text-on-surface-variant/70">Surplus Surplus</span>
                  <span className="font-bold text-tertiary">
                    {formatCurrency(salSurplus)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
