import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency, formatDateShort } from '../utils/helpers';
import { expenseCategories, generateId } from '../data/mockData';

export const ExpensesPage = () => {
  const store = useFinanceStore();
  const monthlyExpenses = store.expenses || [];
  const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const expensesByCategory = monthlyExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  
  const sortedCategories = Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1]);
  const categoryColors = ["#81ecff", "#ac8aff", "#699cff", "#ff716c", "#00d4ec"];

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: 'Food', amount: '', description: '' });

  const handleAddExpense = () => {
    if (formData.amount) {
      store.addExpense({
        id: generateId(),
        ...formData,
        amount: parseInt(formData.amount),
        date: new Date().toISOString().split('T')[0],
      });
      setFormData({ category: 'Food', amount: '', description: '' });
      setShowForm(false);
    }
  };

  const categoryEmojis = { Food: 'restaurant', Travel: 'flight_takeoff', Shopping: 'local_mall', Entertainment: 'movie', Bills: 'receipt_long', Health: 'medical_services', Education: 'school', Other: 'category' };

  // Generate pie circle dashes
  let currentOffset = 0;
  const pieCircles = sortedCategories.slice(0, 4).map((cat, index) => {
    const percentage = totalMonthly === 0 ? 0 : (cat[1] / totalMonthly) * 100;
    const dash = `${percentage} 100`;
    const offset = -currentOffset;
    currentOffset += percentage;
    return (
      <circle key={cat[0]} cx="18" cy="18" fill="transparent" r="15.915" stroke={categoryColors[index % categoryColors.length]} strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="3"></circle>
    );
  });

  return (
    <main className="pt-24 px-4 max-w-4xl mx-auto space-y-8 pb-32">
      {/* AI Intelligence Alert */}
      <div className="glass-panel rounded-xl p-6 flex items-start gap-4 border-l-4 border-primary shadow-[0_0_30px_rgba(129,236,255,0.05)]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center animate-pulse-slow">
            <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>fluid_med</span>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
        </div>
        <div className="flex-1">
          <p className="font-headline text-xs tracking-widest text-primary-dim mb-1 font-bold">FRIDAY INTELLIGENCE RECAP</p>
          <p className="text-on-surface text-lg font-light italic">
            "Analyzing financial patterns... <span className="text-primary font-medium">you're on track with your budget.</span> Generating Flux reports."
          </p>
        </div>
      </div>

      {/* Financial Core HUD */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Monthly Spending Pie/Glow Display */}
        <div className="md:col-span-5 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden aspect-square md:aspect-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          <h2 className="font-headline text-xs tracking-[0.2em] text-on-surface-variant uppercase mb-8 self-start">Monthly Capital Flux</h2>
          
          <div className="relative w-full aspect-square max-w-[240px]">
            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(129,236,255,0.4)]" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="rgba(129,236,255,0.1)" strokeWidth="2.5"></circle>
              {pieCircles}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-3xl font-black text-primary">{formatCurrency(totalMonthly)}</span>
              <span className="font-label text-[10px] text-on-surface-variant tracking-widest uppercase">Total Out</span>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4 w-full">
            {sortedCategories.slice(0, 4).map((cat, idx) => (
              <div key={cat[0]} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: categoryColors[idx % categoryColors.length]}}></div>
                <span className="text-[10px] font-label uppercase text-on-surface-variant">{cat[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Data Stream */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h2 className="font-headline text-xs tracking-[0.2em] text-on-surface-variant uppercase">Recent Ledger</h2>
            <button onClick={() => setShowForm(!showForm)} className="holographic-btn flex items-center gap-2 px-4 py-2 rounded-xl text-primary font-headline text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 group border border-primary/30">
              <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add</span>
              Add Expense
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                className="glass-panel rounded-2xl p-4 space-y-3 border border-secondary/30"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-variant/40 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-variant transition-all">Cancel</button>
                  <button onClick={handleAddExpense} className="flex-1 py-2 text-sm text-surface-lowest bg-primary font-bold rounded-xl hover:scale-105 transition-transform">Add</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction Rows */}
          <div className="space-y-3">
            {monthlyExpenses.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant font-label text-sm uppercase tracking-widest">No expenses tracked</div>
            ) : (
              monthlyExpenses.slice().reverse().map((expense, idx) => (
                <div key={expense._id || expense.id || idx} className="glass-panel group hover:bg-primary/5 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between border-l-2 border-primary/20 hover:border-primary">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary border border-primary/10">
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>{categoryEmojis[expense.category] || 'category'}</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface font-medium text-sm">{expense.description || expense.category}</h3>
                      <p className="text-[10px] font-label uppercase text-on-surface-variant tracking-tighter">Category: {expense.category} • {formatDateShort(expense.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-headline font-bold text-lg">-{formatCurrency(expense.amount)}</div>
                    <button onClick={() => store.deleteExpense(expense._id || expense.id)} className="text-[10px] font-label uppercase text-error/80 tracking-widest hover:text-error">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Secondary Insights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-[#81ecff]/10">
          <span className="material-symbols-outlined text-primary mb-4">monitoring</span>
          <p className="font-headline text-[10px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Weekly Velocity</p>
          <h4 className="text-2xl font-black text-on-surface">+12.5%</h4>
          <div className="w-full bg-surface-container-highest h-1 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[65%] shadow-[0_0_8px_#81ecff]"></div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-[#ac8aff]/10">
          <span className="material-symbols-outlined text-secondary mb-4">account_balance_wallet</span>
          <p className="font-headline text-[10px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Available Capital</p>
          <h4 className="text-2xl font-black text-on-surface">{formatCurrency((store.salary?.amount || 0) * 0.4)}</h4>
          <div className="w-full bg-surface-container-highest h-1 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-[82%] shadow-[0_0_8px_#ac8aff]"></div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-[#699cff]/10">
          <span className="material-symbols-outlined text-tertiary mb-4">shield_with_heart</span>
          <p className="font-headline text-[10px] text-on-surface-variant tracking-[0.1em] uppercase mb-1">Security Score</p>
          <h4 className="text-2xl font-black text-on-surface">9.8 AA</h4>
          <div className="w-full bg-surface-container-highest h-1 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-[98%] shadow-[0_0_8px_#699cff]"></div>
          </div>
        </div>
      </section>
    </main>
  );
};
