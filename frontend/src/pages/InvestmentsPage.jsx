import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InvestmentCard } from '../components/InvestmentCard';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency, generateId } from '../utils/helpers';
import { StatCard, EmptyState } from '../components/UIUtils';
import { investmentTypes } from '../data/mockData';
import { AnimatePresence } from 'framer-motion';

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

  const chartData = store.investments.map((inv) => ({
    name: inv.name.slice(0, 5),
    invested: inv.amount,
    current: inv.currentValue,
  }));

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

  return (
    <div className="pb-32 pt-4 px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">📈 Investments</h1>

        {/* Investment Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            label="Total Invested"
            value={formatCurrency(stats.totalInvested)}
            icon="💰"
            color="indigo"
          />
          <StatCard
            label="Current Value"
            value={formatCurrency(stats.totalValue)}
            icon="📊"
            color={stats.gain >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Gain/Loss Card */}
        <motion.div
          className={`rounded-3xl p-6 text-white mb-6 shadow-premium ${
            stats.gain >= 0
              ? 'bg-gradient-to-br from-green-500 to-green-600'
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-sm opacity-90 mb-2">Total Gain/Loss</p>
          <h2 className="text-3xl font-bold">
            {stats.gain >= 0 ? '+' : ''}{formatCurrency(stats.gain)}
          </h2>
          <p className="text-sm opacity-75 mt-2">({stats.gainPercent.toFixed(2)}%)</p>
        </motion.div>

        {/* Chart */}
        {chartData.length > 0 && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-premium overflow-x-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="font-bold mb-4">Portfolio Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value, 0)} />
                <Bar dataKey="invested" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="current" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Add Investment Button */}
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-premium mb-6"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xl">+</span> Add Investment
        </motion.button>

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 space-y-3 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                type="text"
                placeholder="Investment Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="input-field"
              >
                {investmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount Invested"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Current Value (optional)"
                value={formData.currentValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, currentValue: e.target.value }))}
                className="input-field"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInvestment}
                  className="flex-1 btn-primary text-sm"
                >
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Investment List */}
        <div className="space-y-4">
          {store.investments.map((investment) => (
            <InvestmentCard key={investment.id} investment={investment} />
          ))}
        </div>

        {store.investments.length === 0 && (
          <EmptyState icon="🎯" title="No Investments Yet" description="Start growing your wealth" />
        )}
      </motion.div>
    </div>
  );
};
