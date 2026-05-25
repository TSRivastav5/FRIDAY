import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency, formatDateShort } from '../utils/helpers';
import { expenseCategories, generateId } from '../data/mockData';

export const ExpensesPage = () => {
  const store = useFinanceStore();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: 'Food', amount: '', description: '' });

  useEffect(() => {
    // Fetch expenses on mount
    store.fetchExpenses?.();
  }, []);

  const totalSalary = store.salary?.amount || 0;
  
  // Salary allocation breakdown values
  const emi = store.currentAllocation?.emi ?? 0;
  const rent = store.currentAllocation?.rent ?? 0;
  const sip = store.currentAllocation?.sip ?? 0;
  const travel = store.currentAllocation?.travel ?? 0;
  const bills = store.currentAllocation?.bills ?? 0;
  const totalAllocated = emi + rent + sip + travel + bills;
  const youKeep = totalSalary - totalAllocated;

  const monthlyExpenses = store.expenses || [];
  const totalMonthlyLedger = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async () => {
    if (formData.amount) {
      try {
        await store.addExpense({
          category: formData.category,
          amount: parseInt(formData.amount),
          description: formData.description || formData.category,
          date: new Date().toISOString().split('T')[0],
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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center pb-32">
      {/* Header Section (Dark Navy) */}
      <header className="bg-inverse-surface w-full z-10 pt-12 pb-16 px-5 rounded-b-[40px] text-on-primary text-left">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-on-primary">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-on-primary">Salary Allocation</h1>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-on-primary/60 uppercase tracking-wider">Credited amount</p>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-on-primary">{formatCurrency(totalSalary)}</span>
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
          <div className="p-4 space-y-4">
            {/* Breakdown Rows */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-error"></div>
                <span className="text-sm text-on-surface">Home loan EMI</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">-{formatCurrency(emi * 0.67)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-sm text-on-surface">Car loan EMI</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">-{formatCurrency(emi * 0.33)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-sm text-on-surface">Rent</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">-{formatCurrency(rent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                <span className="text-sm text-on-surface">SIP investment</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">-{formatCurrency(sip)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                <span className="text-sm text-on-surface">Travel budget</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">-{formatCurrency(travel)}</span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-outline"></div>
                <span className="text-sm text-on-surface">Bills + subscriptions</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">-{formatCurrency(bills)}</span>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="bg-tertiary-fixed/20 p-4 flex justify-between items-center border-t border-tertiary-fixed/30">
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">You keep</span>
              <span className="text-base font-bold text-tertiary">{formatCurrency(youKeep)}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
            </div>
          </div>
        </div>

        {/* AI Insight Chip */}
        <div className="mt-6 bg-primary-fixed/30 rounded-xl p-4 border border-primary-fixed/50 flex gap-4 text-left">
          <div className="mt-1">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-on-background leading-relaxed">
              Car loan ends in 2 months. Redirect <span className="font-bold text-primary">₹6,000</span> to liquid fund after that. Want me to set a reminder?
            </p>
            <button className="mt-2 text-primary text-[11px] font-semibold flex items-center gap-1 group">
              VIEW RECOMMENDATION
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Detailed Ledger Section */}
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

          {/* Transaction Ledger Rows */}
          <div className="space-y-3">
            {monthlyExpenses.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-xs uppercase tracking-widest font-semibold">No expenses tracked</div>
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
};
