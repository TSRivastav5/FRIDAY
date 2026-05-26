import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';

export const SalaryModal = ({ isOpen, onClose }) => {
  const store = useFinanceStore();
  const profile = store.user?.financialProfile || {};
  const [salaryInput, setSalaryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Default to user's monthly salary from settings / profile
      setSalaryInput(profile.monthlySalary?.toString() || '');
    }
  }, [isOpen, profile.monthlySalary]);

  const parsedSalary = parseInt(salaryInput, 10) || 0;

  // Retrieve rule defaults from Financial Rules in Settings
  const emi = profile.fixedExpenses?.emiDefault ?? 0;
  const rent = profile.fixedExpenses?.rent ?? 0;
  const sip = profile.sipDefault ?? 0;
  const travel = profile.travelDefault ?? 0;
  const bills = profile.billsDefault ?? 0;
  const totalAllocated = emi + rent + sip + travel + bills;
  const surplus = parsedSalary - totalAllocated;

  const handleConfirm = async () => {
    if (parsedSalary <= 0) {
      alert('Please enter a valid salary amount');
      return;
    }

    setIsLoading(true);
    try {
      await store.creditSalary(parsedSalary);
      await store.fetchSalaryHistory?.();
      onClose();
      // Navigate to History tab to see the allocation detail
      store.setActiveTab('expenses'); 
    } catch (error) {
      console.error('Failed to credit salary in modal:', error);
      alert(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-background w-full max-w-md rounded-2xl p-5 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border-[0.5px] border-outline-variant/30 text-left"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold font-headline text-on-surface">Confirm Salary Credit</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">For {getMonthName()} {new Date().getFullYear()}</p>
            </div>

            {/* Scrollable breakdown content */}
            <div className="overflow-y-auto pr-1 flex-grow space-y-4 no-scrollbar pb-4">
              
              {/* Input card */}
              <div className="bg-surface-container-low border-[0.5px] border-outline-variant/30 rounded-xl p-4">
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Credited Amount (₹)</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-primary">₹</span>
                  <input
                    type="number"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full bg-transparent border-none text-2xl font-black text-on-surface focus:ring-0 focus:outline-none p-0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Itemized commitments breakdown based on Financial Rules */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest pl-1">Planned Commitments</h3>
                
                <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant/20 rounded-xl divide-y divide-outline-variant/10">
                  
                  {/* Rent */}
                  <div className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#5856D6]/10 flex items-center justify-center text-[#5856D6]">
                        <span className="material-symbols-outlined text-[16px]">home</span>
                      </div>
                      <span className="font-semibold text-on-surface-variant">House Rent</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {rent > 0 ? formatCurrency(rent) : <span className="text-primary font-bold">Not set</span>}
                    </span>
                  </div>

                  {/* EMI */}
                  <div className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#FFB038]/10 flex items-center justify-center text-[#FFB038]">
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      </div>
                      <span className="font-semibold text-on-surface-variant">EMI Commitments</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {emi > 0 ? formatCurrency(emi) : <span className="text-primary font-bold">Not set</span>}
                    </span>
                  </div>

                  {/* SIP */}
                  <div className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
                        <span className="material-symbols-outlined text-[16px]">eco</span>
                      </div>
                      <span className="font-semibold text-on-surface-variant">SIP Investments</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {sip > 0 ? formatCurrency(sip) : <span className="text-primary font-bold">Not set</span>}
                    </span>
                  </div>

                  {/* Travel */}
                  <div className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#FF2D55]/10 flex items-center justify-center text-[#FF2D55]">
                        <span className="material-symbols-outlined text-[16px]">directions_car</span>
                      </div>
                      <span className="font-semibold text-on-surface-variant">Travel Budget</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {travel > 0 ? formatCurrency(travel) : <span className="text-primary font-bold">Not set</span>}
                    </span>
                  </div>

                  {/* Bills */}
                  <div className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#8E8E93]/10 flex items-center justify-center text-[#8E8E93]">
                        <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      </div>
                      <span className="font-semibold text-on-surface-variant">Bills & Utilities</span>
                    </div>
                    <span className="font-bold text-on-surface">
                      {bills > 0 ? formatCurrency(bills) : <span className="text-primary font-bold">Not set</span>}
                    </span>
                  </div>

                </div>
              </div>

              {/* Surplus result box */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Recalculated Surplus</span>
                  <span className="block text-xl font-black mt-0.5">{formatCurrency(surplus)}</span>
                </div>
                <span className="material-symbols-outlined text-3xl opacity-90" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>

            </div>

            {/* Confirm buttons */}
            <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/10 pt-4 shrink-0">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="py-3.5 text-xs font-bold text-on-surface-variant bg-surface-container border border-outline-variant/20 rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="py-3.5 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-1.5 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-xs">autorenew</span>
                    Crediting...
                  </>
                ) : (
                  <>
                    Confirm & Save ✓
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
