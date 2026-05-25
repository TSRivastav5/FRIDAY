import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';
import { aiService } from '../services/AIService';
import { mcpService } from '../services/MCPService';
import { notificationService } from '../services/NotificationService';

export const SalaryModal = ({ isOpen, onClose, onSubmit, currentAllocation }) => {
  const [step, setStep] = useState('input');
  const [salaryInput, setSalaryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [mcpRecommendation, setMcpRecommendation] = useState(null);

  const [formData, setFormData] = useState({
    salary: currentAllocation?.salary ?? 0,
    emi: currentAllocation?.emi ?? 0,
    rent: currentAllocation?.rent ?? 0,
    travel: currentAllocation?.travel ?? 0,
    sip: currentAllocation?.sip ?? 0,
    bills: currentAllocation?.bills ?? 0,
  });

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setSalaryInput('');
      setAiInsight(null);
      setMcpRecommendation(null);
      if (currentAllocation) {
        setFormData({
          salary: currentAllocation.salary ?? 0,
          emi: currentAllocation.emi ?? 0,
          rent: currentAllocation.rent ?? 0,
          travel: currentAllocation.travel ?? 0,
          sip: currentAllocation.sip ?? 0,
          bills: currentAllocation.bills ?? 0,
        });
      }
    }
  }, [isOpen, currentAllocation]);

  const handleSalarySubmit = async () => {
    if (!salaryInput || parseInt(salaryInput) <= 0) {
      alert('Please enter a valid salary amount');
      return;
    }

    const salary = parseInt(salaryInput);
    setFormData({ salary, ...aiService.calculateSalaryAllocation(salary) });
    setStep('review');
  };

  const handleReviewComplete = async () => {
    setIsLoading(true);
    try {
      const advice = await aiService.getSalaryAdvice(formData.salary);
      setFormData((prev) => ({
        ...prev,
        ...advice,
      }));
      setAiInsight(advice.analysis || 'Allocation personalized based on your profile.');
      setStep('adjust');
    } catch (error) {
      console.error('Error getting AI advice:', error);
      setStep('adjust');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: parseInt(value) }));
  };

  const handleAdjustComplete = async () => {
    setIsLoading(true);
    try {
      const insight = await mcpService.queryGrowPortfolio([
        { name: 'SIP Portfolio', type: 'SIP', invested: formData.sip * 12, currentValue: formData.sip * 12 * 1.12 },
      ]);
      setMcpRecommendation(insight);
      const hasPermission = await notificationService.requestPermission();

      if (hasPermission) {
        await notificationService.notifySalaryCredit(formData.salary, formData, aiInsight);
      } else {
        notificationService.showToast(
          `Salary credited: ₹${formData.salary.toLocaleString('en-IN')}`,
          'success'
        );
      }

      if (insight && hasPermission) {
        setTimeout(() => {
          notificationService.notifyInvestmentInsight(insight.recommendation, insight.suggestedAmount);
        }, 2000);
      }

      setStep('insight');
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setStep('insight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    onSubmit({
      ...formData,
      remaining: Math.max(0, formData.salary - (formData.emi + formData.rent + formData.travel + formData.sip + formData.bills)),
    });
    onClose();
  };

  const remaining = formData.salary - (formData.emi + formData.rent + formData.travel + formData.sip + formData.bills);

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
            className="bg-background w-full max-w-md rounded-2xl p-5 overflow-hidden flex flex-col max-h-[80vh] shadow-2xl border-[0.5px] border-outline-variant/30 text-left"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Container wrapper to prevent height overflow cutoff */}
            <div className="overflow-y-auto pr-1 flex-grow space-y-4 no-scrollbar max-h-[calc(80vh-60px)] pb-4">
              <AnimatePresence mode="wait">
                {/* STEP 1: Salary Input */}
                {step === 'input' && (
                  <motion.div
                    key="step-input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-headline text-on-surface">How much was credited?</h2>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Enter your salary amount to initialize allocation</p>
                    </div>

                    <div className="bg-white border-[0.5px] border-outline-variant/40 rounded-xl p-4">
                      <label className="block text-[10px] font-semibold text-outline uppercase tracking-wider mb-2">Salary Amount</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">₹</span>
                        <input
                          type="number"
                          value={salaryInput}
                          onChange={(e) => setSalaryInput(e.target.value)}
                          placeholder="85000"
                          className="w-full bg-transparent border-none text-xl font-bold text-on-surface focus:ring-0 focus:outline-none p-0"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="py-3 text-xs font-bold text-on-surface-variant bg-white border border-outline-variant/40 rounded-xl hover:bg-surface-container active:scale-[0.98] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSalarySubmit}
                        className="py-3 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/10"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Review Smart Allocation */}
                {step === 'review' && (
                  <motion.div
                    key="step-review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-headline text-on-surface">Smart Allocation</h2>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Calculated optimal allocation based on rules</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'EMI', key: 'emi', icon: 'receipt_long', color: 'text-[#FFB038]', bg: 'bg-[#FFB038]/10' },
                        { label: 'Rent', key: 'rent', icon: 'home', color: 'text-[#5856D6]', bg: 'bg-[#5856D6]/10' },
                        { label: 'SIP', key: 'sip', icon: 'eco', color: 'text-[#34C759]', bg: 'bg-[#34C759]/10' },
                        { label: 'Travel', key: 'travel', icon: 'directions_car', color: 'text-[#FF2D55]', bg: 'bg-[#FF2D55]/10' },
                        { label: 'Bills', key: 'bills', icon: 'lightbulb', color: 'text-outline', bg: 'bg-outline/10' },
                      ].map(({ label, key, icon, color, bg }) => (
                        <div
                          key={key}
                          className="bg-white border-[0.5px] border-outline-variant/30 rounded-xl p-3 flex items-center gap-3"
                        >
                          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color} shrink-0`}>
                            <span className="material-symbols-outlined text-sm">{icon}</span>
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">{label}</span>
                            <span className="block text-sm font-bold text-on-surface truncate">{formatCurrency(formData[key])}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 text-white text-center flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">Left for You</span>
                        <span className="block text-xl font-bold mt-0.5">{formatCurrency(remaining)}</span>
                      </div>
                      <span className="material-symbols-outlined text-3xl opacity-90" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setStep('input')}
                        className="py-3 text-xs font-bold text-on-surface-variant bg-white border border-outline-variant/40 rounded-xl hover:bg-surface-container active:scale-[0.98] transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleReviewComplete}
                        disabled={isLoading}
                        className="py-3 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/10"
                      >
                        {isLoading ? 'Analyzing...' : 'Personalize'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Adjust with Sliders */}
                {step === 'adjust' && (
                  <motion.div
                    key="step-adjust"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold font-headline text-on-surface">Fine-tune Your Plan</h2>
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            emi: 0,
                            rent: 0,
                            sip: 0,
                            travel: 0,
                            bills: 0
                          }))}
                          className="px-2.5 py-1 text-[10px] font-bold text-error bg-error/5 hover:bg-error/10 border border-error/15 rounded-lg active:scale-95 transition-all"
                        >
                          Reset to ₹0
                        </button>
                      </div>
                      {aiInsight && (
                        <p className="text-[11px] font-medium text-primary bg-primary/5 border border-primary/10 p-2.5 rounded-lg mt-1.5 leading-relaxed">
                          💡 {aiInsight}
                        </p>
                      )}
                    </div>

                    {/* Sliders List */}
                    <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                      {[
                        { label: 'EMI / Loans', key: 'emi', icon: 'receipt_long', color: 'text-[#FFB038]', max: formData.salary * 0.5 },
                        { label: 'Rent', key: 'rent', icon: 'home', color: 'text-[#5856D6]', max: formData.salary * 0.5 },
                        { label: 'SIP Investment', key: 'sip', icon: 'eco', color: 'text-[#34C759]', max: formData.salary * 0.5 },
                        { label: 'Travel', key: 'travel', icon: 'directions_car', color: 'text-[#FF2D55]', max: formData.salary * 0.2 },
                        { label: 'Bills / Utilities', key: 'bills', icon: 'lightbulb', color: 'text-outline', max: formData.salary * 0.2 },
                      ].map(({ label, key, icon, color, max }) => (
                        <div key={key} className="bg-white p-3 rounded-xl border-[0.5px] border-outline-variant/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
                              <span className="text-xs font-semibold text-on-surface">{label}</span>
                            </div>
                            <span className="text-xs font-bold text-primary">{formatCurrency(formData[key])}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={max}
                            step="500"
                            value={formData[key]}
                            onChange={(e) => handleSliderChange(key, e.target.value)}
                            className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-3.5 text-white flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">Money Left for You</span>
                        <span className="block text-lg font-bold mt-0.5">{formatCurrency(remaining)}</span>
                      </div>
                      <span className="material-symbols-outlined text-2xl opacity-90" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setStep('review')}
                        className="py-3 text-xs font-bold text-on-surface-variant bg-white border border-outline-variant/40 rounded-xl hover:bg-surface-container active:scale-[0.98] transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleAdjustComplete}
                        disabled={isLoading}
                        className="py-3 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/10"
                      >
                        {isLoading ? 'Processing...' : 'Complete'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Success / AI Recommendation */}
                {step === 'insight' && (
                  <motion.div
                    key="step-insight"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-headline text-on-surface">Plan Calibrated</h2>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Your salary has been allocated successfully</p>
                    </div>

                    <div className="bg-white border-[0.5px] border-outline-variant/30 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-on-surface-variant">Salary Credited</span>
                        <span className="font-bold text-sm text-primary">{formatCurrency(formData.salary)}</span>
                      </div>
                      <div className="border-t border-outline-variant/20 pt-3 flex justify-between items-center">
                        <span className="text-xs font-semibold text-on-surface">Available Surplus</span>
                        <span className="font-bold text-base text-tertiary">{formatCurrency(remaining)}</span>
                      </div>
                    </div>

                    {mcpRecommendation && (
                      <div className="bg-[#FFB038]/5 border border-[#FFB038]/20 rounded-xl p-3.5 flex gap-3 text-left">
                        <span className="material-symbols-outlined text-[#FFB038] text-xl shrink-0">trending_up</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface">Investment Advice</p>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{mcpRecommendation.recommendation}</p>
                          {mcpRecommendation.suggestedAmount > 0 && (
                            <button className="mt-2.5 px-3 py-1.5 bg-[#FFB038] text-white rounded-lg text-[10px] font-bold hover:opacity-90 active:scale-[0.95] transition-all">
                              Top up {formatCurrency(mcpRecommendation.suggestedAmount)}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-sm shrink-0">notifications_active</span>
                      <p className="text-[10px] text-primary font-medium tracking-wide">Telemetry notifications generated for your bank profiles.</p>
                    </div>

                    <button
                      onClick={handleFinalSubmit}
                      className="w-full py-4 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/10"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
