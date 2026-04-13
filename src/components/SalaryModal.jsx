import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';

export const SalaryModal = ({ isOpen, onClose, onSubmit, currentAllocation }) => {
  const [formData, setFormData] = useState({
    salary: currentAllocation?.salary || 50000,
    emi: currentAllocation?.emi || 15000,
    rent: currentAllocation?.rent || 10000,
    travel: currentAllocation?.travel || 3000,
    sip: currentAllocation?.sip || 10000,
    savings: currentAllocation?.savings || 5000,
  });

  const handleSliderChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: parseInt(value) }));
  };

  const remaining =
    formData.salary - (formData.emi + formData.rent + formData.travel + formData.sip + formData.savings);

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      remaining: Math.max(0, remaining),
    });
    onClose();
  };

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
            <h2 className="text-2xl font-bold mb-6">Salary Credit - ₹{formData.salary.toLocaleString()}</h2>

            <div className="space-y-6">
              {/* Sliders */}
              <div className="space-y-4">
                {[
                  { label: 'EMI/Loans', key: 'emi', max: formData.salary * 0.5 },
                  { label: 'Rent', key: 'rent', max: formData.salary * 0.5 },
                  { label: 'Travel', key: 'travel', max: formData.salary * 0.2 },
                  { label: 'SIP Investment', key: 'sip', max: formData.salary * 0.5 },
                  { label: 'Emergency Savings', key: 'savings', max: formData.salary * 0.2 },
                ].map(({ label, key, max }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">{label}</span>
                      <span className="text-indigo-500 font-bold">{formatCurrency(formData[key])}</span>
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

              {/* Remaining Balance */}
              <motion.div
                className="bg-gradient-to-r from-green-400 to-green-500 rounded-3xl p-6 text-white"
                animate={{ scale: remaining > 0 ? 1 : 0.95 }}
              >
                <div className="text-sm opacity-90">Money Left After Allocation</div>
                <div className="text-3xl font-bold mt-2">{formatCurrency(remaining)}</div>
              </motion.div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 btn-primary"
                >
                  Accept Plan
                </button>
              </div>

              <button className="w-full py-3 border-2 border-indigo-500 text-indigo-500 rounded-2xl font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                💬 Ask FRIDAY
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
