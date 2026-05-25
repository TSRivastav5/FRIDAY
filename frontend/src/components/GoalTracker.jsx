import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';
import { useFinanceStore } from '../store/financeStore';

export const GoalTracker = () => {
  const store = useFinanceStore();
  const surplus = store.salary?.amount - ((store.currentAllocation?.emi || 0) + (store.currentAllocation?.rent || 0) + (store.currentAllocation?.sip || 0) + (store.currentAllocation?.travel || 0) + (store.currentAllocation?.bills || 0)) || 0;

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('friday_goals');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Emergency Fund', target: 100000, current: 45000, category: 'Safety' },
      { id: '2', name: 'Dream Vacation', target: 50000, current: 15000, category: 'Leisure' }
    ];
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', target: '', current: '', category: 'Safety' });
  const [updateAmt, setUpdateAmt] = useState({ goalId: null, amount: '', action: 'add' }); // 'add' | 'withdraw'

  useEffect(() => {
    localStorage.setItem('friday_goals', JSON.stringify(goals));
  }, [goals]);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.target) return;
    
    const newGoal = {
      id: Date.now().toString(),
      name: formData.name,
      target: parseFloat(formData.target),
      current: parseFloat(formData.current) || 0,
      category: formData.category
    };

    setGoals([...goals, newGoal]);
    setFormData({ name: '', target: '', current: '', category: 'Safety' });
    setShowForm(false);
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm("Are you sure you want to delete this financial goal?")) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const handleUpdateMoney = (e) => {
    e.preventDefault();
    const amt = parseFloat(updateAmt.amount);
    if (isNaN(amt) || amt <= 0 || !updateAmt.goalId) return;

    setGoals(goals.map(g => {
      if (g.id === updateAmt.goalId) {
        let newCurrent = g.current;
        if (updateAmt.action === 'add') {
          newCurrent = Math.min(g.target, g.current + amt);
        } else {
          newCurrent = Math.max(0, g.current - amt);
        }
        return { ...g, current: newCurrent };
      }
      return g;
    }));

    setUpdateAmt({ goalId: null, amount: '', action: 'add' });
  };

  return (
    <div className="space-y-4 text-left">
      {/* Header Row */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Financial Goals</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-xl text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Add Goal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            onSubmit={handleAddGoal}
            className="bg-surface-container-lowest p-4 rounded-xl border-[0.5px] border-outline-variant/30 space-y-3 shadow-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text"
              placeholder="Goal Name (e.g. Emergency Fund)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Target Amount"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                required
              />
              <input
                type="number"
                placeholder="Starting Amount"
                value={formData.current}
                onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
              />
            </div>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
            >
              <option value="Safety">Safety & Emergency</option>
              <option value="Leisure">Travel & Leisure</option>
              <option value="Gadgets">Gadgets & Assets</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit" className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
              Create Goal
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Update Money Modal overlay inline */}
      <AnimatePresence>
        {updateAmt.goalId && (
          <motion.form 
            onSubmit={handleUpdateMoney}
            className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3 text-left"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {updateAmt.action === 'add' ? 'Add money to' : 'Withdraw from'} {goals.find(g => g.id === updateAmt.goalId)?.name}
              </span>
              <button 
                type="button" 
                onClick={() => setUpdateAmt({ goalId: null, amount: '', action: 'add' })}
                className="text-on-surface/40 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount (e.g. 5000)"
                value={updateAmt.amount}
                onChange={(e) => setUpdateAmt({ ...updateAmt, amount: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-xs bg-background text-on-surface"
                required
                autoFocus
              />
              <button type="submit" className="px-4 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90">
                Confirm
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 gap-3">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          const timeToReach = surplus > 0 ? Math.ceil((g.target - g.current) / surplus) : null;
          
          return (
            <div key={g.id} className="bg-surface-container-lowest p-4 rounded-xl border-[0.5px] border-outline-variant/30 flex flex-col gap-3.5 hover:shadow-sm transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    g.category === 'Safety' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' :
                    g.category === 'Leisure' ? 'bg-[#5856D6]/10 text-[#5856D6]' :
                    g.category === 'Gadgets' ? 'bg-[#FFB038]/10 text-[#FFB038]' :
                    'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {g.category === 'Safety' ? 'security' :
                       g.category === 'Leisure' ? 'flight_takeoff' :
                       g.category === 'Gadgets' ? 'devices' :
                       'star'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface leading-tight">{g.name}</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">{g.category} Target</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setUpdateAmt({ goalId: g.id, amount: '', action: 'add' })}
                    className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center active:scale-90 transition-transform"
                    title="Add Money"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                  <button 
                    onClick={() => setUpdateAmt({ goalId: g.id, amount: '', action: 'withdraw' })}
                    className="w-7 h-7 rounded-lg bg-on-surface-variant/10 hover:bg-on-surface-variant/20 text-on-surface flex items-center justify-center active:scale-90 transition-transform"
                    title="Withdraw Money"
                  >
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(g.id)}
                    className="w-7 h-7 rounded-lg bg-error/10 hover:bg-error/20 text-error flex items-center justify-center active:scale-90 transition-transform"
                    title="Delete Goal"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-on-surface">{pct}% completed</span>
                  <span className="text-on-surface-variant font-medium">
                    {formatCurrency(g.current)} <span className="opacity-40">/</span> {formatCurrency(g.target)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct === 100 ? 'bg-tertiary shadow-[0_0_8px_rgba(52,199,89,0.3)]' : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Dynamic AI Advice Sub-footer */}
              {pct < 100 && (
                <div className="pt-2 border-t border-outline-variant/10 flex items-center gap-1.5 text-[10px] text-on-surface-variant font-semibold">
                  <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                  <span>
                    {timeToReach ? (
                      `Paced to achieve in ${timeToReach} months using surplus (₹${surplus.toLocaleString('en-IN')}/mo)`
                    ) : (
                      "Set a monthly salary allocation in Settings to estimate pacing."
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
