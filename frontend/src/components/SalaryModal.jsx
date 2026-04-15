import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';
import { aiService } from '../services/AIService';
import { mcpService } from '../services/MCPService';
import { notificationService } from '../services/NotificationService';

export const SalaryModal = ({ isOpen, onClose, onSubmit, currentAllocation }) => {
  // Multi-step flow: 'input' → 'review' → 'adjust' → 'insight'
  const [step, setStep] = useState('input');
  const [salaryInput, setSalaryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [mcpRecommendation, setMcpRecommendation] = useState(null);

  const [formData, setFormData] = useState({
    salary: currentAllocation?.salary || 50000,
    emi: currentAllocation?.emi || 15000,
    rent: currentAllocation?.rent || 10000,
    travel: currentAllocation?.travel || 3000,
    sip: currentAllocation?.sip || 10000,
    bills: currentAllocation?.bills || 1500,
  });

  // Reset on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setSalaryInput('');
      setAiInsight(null);
      setMcpRecommendation(null);
    }
  }, [isOpen]);

  // Auto-calculate allocation when salary is entered
  const handleSalarySubmit = async () => {
    if (!salaryInput || parseInt(salaryInput) <= 0) {
      alert('Please enter a valid salary amount');
      return;
    }

    const salary = parseInt(salaryInput);
    setFormData({ salary, ...aiService.calculateSalaryAllocation(salary) });
    setStep('review');
  };

  // Get AI recommendations
  const handleReviewComplete = async () => {
    setIsLoading(true);
    try {
      // Get AI advice
      const advice = await aiService.getSalaryAdvice(formData.salary);
      setFormData((prev) => ({
        ...prev,
        ...advice,
      }));

      // Update form to show AI-adjusted values
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

  // Show investment insight and notification
  const handleAdjustComplete = async () => {
    setIsLoading(true);
    try {
      // Get investment insight from MCP/Grow
      const insight = await mcpService.queryGrowPortfolio([
        { name: 'SIP Portfolio', type: 'SIP', invested: formData.sip * 12, currentValue: formData.sip * 12 * 1.12 },
      ]);

      setMcpRecommendation(insight);

      // Request notification permission if needed
      const hasPermission = await notificationService.requestPermission();

      // Send salary notification
      if (hasPermission) {
        await notificationService.notifySalaryCredit(formData.salary, formData, aiInsight);
      } else {
        notificationService.showToast(
          `Salary credited: ₹${formData.salary.toLocaleString('en-IN')}`,
          'success'
        );
      }

      // Send MCP recommendation as notification if available
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            exit={{ y: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== STEP 1: Salary Input ===== */}
            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div
                  key="step-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold">How much was credited?</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Enter your salary amount</p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4">
                    <label className="block text-sm font-semibold mb-2">Salary Amount</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">₹</span>
                      <input
                        type="number"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        placeholder="85000"
                        className="input-field text-2xl font-bold flex-1"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSalarySubmit}
                      className="btn-primary"
                    >
                      Continue →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 2: Review Auto-Calculated Allocation ===== */}
              {step === 'review' && (
                <motion.div
                  key="step-review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold">Smart Allocation</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Claude calculated your optimal allocation</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { label: 'EMI', key: 'emi', icon: '💳' },
                      { label: 'Rent', key: 'rent', icon: '🏠' },
                      { label: 'SIP', key: 'sip', icon: '📈' },
                      { label: 'Travel', key: 'travel', icon: '🚗' },
                      { label: 'Bills', key: 'bills', icon: '💡' },
                    ].map(({ label, key, icon }) => (
                      <div
                        key={key}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 text-center"
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(formData[key])}
                        </div>
                      </div>
                    ))}
                  </div>

                  <motion.div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl p-6 text-white text-center"
                    animate={{ scale: remaining > 0 ? 1 : 0.95 }}
                  >
                    <div className="text-sm opacity-90">Left for You</div>
                    <div className="text-4xl font-bold mt-2">💚 {formatCurrency(remaining)}</div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStep('input')}
                      className="btn-secondary"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleReviewComplete}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? '⏳ Analyzing...' : 'Personalize →'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 3: Adjust with Sliders ===== */}
              {step === 'adjust' && (
                <motion.div
                  key="step-adjust"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold">Fine-tune Your Plan</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {aiInsight && `✨ ${aiInsight}`}
                    </p>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4 max-h-72 overflow-y-auto">
                    {[
                      { label: 'EMI/Loans', key: 'emi', emoji: '💳', max: formData.salary * 0.5 },
                      { label: 'Rent', key: 'rent', emoji: '🏠', max: formData.salary * 0.5 },
                      { label: 'SIP Investment', key: 'sip', emoji: '📈', max: formData.salary * 0.5 },
                      { label: 'Travel', key: 'travel', emoji: '🚗', max: formData.salary * 0.2 },
                      { label: 'Bills / Utilities', key: 'bills', emoji: '💡', max: formData.salary * 0.2 },
                    ].map(({ label, key, emoji, max }) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold">
                            {emoji} {label}
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {formatCurrency(formData[key])}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={max}
                          step="500"
                          value={formData[key]}
                          onChange={(e) => handleSliderChange(key, e.target.value)}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Updated Remaining */}
                  <motion.div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl p-6 text-white"
                    animate={{ scale: remaining > 0 ? 1 : 0.95 }}
                  >
                    <div className="text-sm opacity-90">Money Left After Allocation</div>
                    <div className="text-3xl font-bold mt-2">💚 {formatCurrency(remaining)}</div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStep('review')}
                      className="btn-secondary"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleAdjustComplete}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? '⏳ Processing...' : 'Complete ✓'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 4: AI Insight & Recommendations ===== */}
              {step === 'insight' && (
                <motion.div
                  key="step-insight"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold">✅ Plan Accepted</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Your salary has been allocated</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Salary Credited</span>
                      <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(formData.salary)}
                      </span>
                    </div>
                    <div className="border-t border-indigo-200 dark:border-indigo-700 pt-3 flex justify-between items-center">
                      <span className="font-semibold">Available for You</span>
                      <span className="font-bold text-xl text-green-500">
                        💚 {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* MCP Recommendation */}
                  {mcpRecommendation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4"
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl">📈</div>
                        <div>
                          <div className="font-semibold text-amber-900 dark:text-amber-100">Investment Opportunity</div>
                          <div className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                            {mcpRecommendation.recommendation}
                          </div>
                          {mcpRecommendation.suggestedAmount > 0 && (
                            <button className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
                              💰 Top up {formatCurrency(mcpRecommendation.suggestedAmount)}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Notification Status */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-sm">
                    <div className="text-blue-700 dark:text-blue-300">
                      🔔 You'll receive notifications for important salary & investment updates
                    </div>
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    className="w-full btn-primary py-4 text-lg"
                  >
                    ✅ Done
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
