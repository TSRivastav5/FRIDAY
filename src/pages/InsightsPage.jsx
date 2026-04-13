import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';
import { StatCard } from '../components/UIUtils';
import { fridayInsights } from '../data/mockData';

export const InsightsPage = () => {
  const store = useFinanceStore();
  const monthlyExpenses = store.getMonthlyExpenses(store);
  const totalMonthly = store.getTotalMonthlyExpense(store);
  const investStats = store.getInvestmentStats(store);

  // Generate mock trend data
  const trendData = [
    { date: 'Week 1', spending: 1200, budget: 2000 },
    { date: 'Week 2', spending: 1800, budget: 2000 },
    { date: 'Week 3', spending: 1500, budget: 2000 },
    { date: 'Week 4', spending: 1400, budget: 2000 },
  ];

  const expensesByCategory = store.getExpensesByCategory(store);
  const categoryEntries = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="pb-32 pt-4 px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">💡 Insights & Analytics</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            label="Monthly Avg"
            value={formatCurrency(totalMonthly / Math.max(1, monthlyExpenses.length))}
            icon="📊"
            color="indigo"
          />
          <StatCard
            label="Investment Gain"
            value={formatCurrency(investStats.gain)}
            icon="📈"
            color={investStats.gain >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Spending Trend */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-premium"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h3 className="font-bold mb-4">Weekly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value, 0)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="spending"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                name="Your Spending"
              />
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10b981', r: 4 }}
                name="Budget"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Spending Categories */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-premium"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold mb-4">📌 Top Spending Categories</h3>
          <div className="space-y-3">
            {categoryEntries.slice(0, 5).map(([category, amount], idx) => (
              <motion.div
                key={category}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <span className="text-3xl">{getCategoryEmoji(category)}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{category}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(amount / Math.max(...Object.values(expensesByCategory))) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className="font-bold text-indigo-500 text-sm">{formatCurrency(amount)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Smart Suggestions */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-premium"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-bold mb-4">🎯 FRIDAY's Smart Suggestions</h3>
          <div className="space-y-4">
            {[
              {
                icon: '🔍',
                title: 'Spending Alert',
                description: 'You spent 25% more on food this month compared to last month. Try meal planning!',
              },
              {
                icon: '💪',
                title: 'Investment Opportunity',
                description: 'Your SIP investments gained 4.2% this quarter. Maintain the momentum!',
              },
              {
                icon: '🎁',
                title: 'Savings Opportunity',
                description: 'You can increase your SIP by ₹2,000/month without affecting lifestyle.',
              },
              {
                icon: '🚗',
                title: 'Travel Optimization',
                description: 'Monthly travel pass would save you ₹500. Current spending: ₹800/month',
              },
            ].map((suggestion, idx) => (
              <motion.div
                key={idx}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <div className="flex gap-3">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{suggestion.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

function getCategoryEmoji(category) {
  const icons = {
    Food: '🍔',
    Travel: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎬',
    Bills: '📱',
    Health: '🏥',
    Education: '📚',
    Other: '📌',
  };
  return icons[category] || '📌';
}
