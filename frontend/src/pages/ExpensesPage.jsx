import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ExpenseList } from '../components/ExpenseList';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';
import { StatCard, EmptyState } from '../components/UIUtils';

export const ExpensesPage = () => {
  const store = useFinanceStore();
  const monthlyExpenses = store.expenses || [];
  const expensesByCategory = monthlyExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const chartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
    color: getCategoryColor(category),
  }));

  return (
    <div className="pb-32 pt-4 px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">📊 Expenses</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Total Spent" value={formatCurrency(totalMonthly)} icon="💸" color="red" />
          <StatCard label="Categories" value={Object.keys(expensesByCategory).length} icon="📂" color="indigo" />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-premium"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="font-bold mb-4">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Category Details */}
        {Object.keys(expensesByCategory).length > 0 && (
          <motion.div className="bg-white dark:bg-gray-800 rounded-3xl p-5 mb-6 shadow-premium">
            <h3 className="font-bold mb-4">Category Wise Spending</h3>
            <div className="space-y-3">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm font-semibold">{getCategoryEmoji(category)} {category}</span>
                  <div className="flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(amount / Math.max(...Object.values(expensesByCategory))) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-sm font-bold text-indigo-500 w-16 text-right">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Expense List */}
        <ExpenseList
          expenses={monthlyExpenses}
          onAddExpense={store.addExpense}
          onDeleteExpense={store.deleteExpense}
        />

        {monthlyExpenses.length === 0 && (
          <EmptyState icon="🛒" title="No Expenses Yet" description="Track your spending here" />
        )}
      </motion.div>
    </div>
  );
};

function getCategoryColor(category) {
  const colors = {
    Food: '#FF6B6B',
    Travel: '#4ECDC4',
    Shopping: '#FFE66D',
    Entertainment: '#95E1D3',
    Bills: '#C7CEEA',
    Health: '#FF8B94',
    Education: '#B4A7D6',
    Other: '#D4A5A5',
  };
  return colors[category] || '#95E1D3';
}

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
