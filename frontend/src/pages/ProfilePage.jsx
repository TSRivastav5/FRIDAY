import React from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';

export const ProfilePage = () => {
  const store = useFinanceStore();

  const stats = store.getInvestmentStats(store);
  const monthlyExpenses = store.getMonthlyExpenses(store);
  const totalMonthly = store.getTotalMonthlyExpense(store);

  return (
    <div className="pb-32 pt-4 px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">👤 Profile</h1>

        {/* User Card */}
        <motion.div
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl p-8 mb-6 shadow-premium"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-3xl font-bold">{store.userName}</h2>
          <p className="opacity-75 mt-2">Financial Freedom Seeker</p>
        </motion.div>

        {/* Financial Stats */}
        <h3 className="font-bold text-lg mb-4">💰 Your Financial Stats</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Total Balance', value: formatCurrency(store.totalBalance), icon: '💳' },
            { label: 'Monthly Salary', value: formatCurrency(store.monthlySalary), icon: '💵' },
            { label: 'Total Invested', value: formatCurrency(stats.totalInvested), icon: '📈' },
            { label: 'Investment Gain', value: formatCurrency(stats.gain), icon: '📊' },
            { label: 'Monthly Expenses', value: formatCurrency(totalMonthly), icon: '💸' },
            { label: 'Transaction Count', value: monthlyExpenses.length, icon: '📝' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-premium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="font-bold text-lg mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Settings */}
        <h3 className="font-bold text-lg mb-4">⚙️ Settings</h3>
        <div className="space-y-3">
          {[
            { icon: '🌙', label: 'Dark Mode', toggle: true },
            { icon: '🔔', label: 'Salary Reminders', toggle: true },
            { icon: '📧', label: 'Email Notifications', toggle: false },
            { icon: '📱', label: 'Budget Alerts', toggle: true },
            { icon: '🔐', label: 'Two Factor Auth', toggle: false },
          ].map((setting, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-premium"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{setting.icon}</span>
                <span className="font-semibold text-sm">{setting.label}</span>
              </div>
              <button
                onClick={() => store.toggleDarkMode()}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  setting.toggle
                    ? 'bg-indigo-500 dark:bg-indigo-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                  animate={{ x: setting.toggle ? 20 : 0 }}
                />
              </button>
            </motion.div>
          ))}
        </div>

        {/* About Section */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mt-8 shadow-premium"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-lg mb-4">ℹ️ About FRIDAY</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            FRIDAY (Financial Resource Intelligent Daily Assistant for You) is your personal AI-powered financial companion.
          </p>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✓ Track expenses and income</p>
            <p>✓ Get AI-powered financial insights</p>
            <p>✓ Manage investments portfolio</p>
            <p>✓ Automatic salary allocation</p>
            <p>✓ Smart financial suggestions</p>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 mt-8 text-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="font-semibold">FRIDAY v1.0.0</p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Built with ❤️ for your financial freedom</p>
          <p className="text-xs text-gray-500 mt-4">© 2026 FRIDAY Finance</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
