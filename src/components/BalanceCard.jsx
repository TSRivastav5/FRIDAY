import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, getGreeting } from '../utils/helpers';

export const BalanceCard = ({ userName, balance, monthlySalary }) => {
  return (
    <motion.div
      className="premium-card bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-start mb-12">
        <div>
          <p className="text-sm opacity-90">{getGreeting()},</p>
          <h1 className="text-3xl font-bold">{userName}👋</h1>
        </div>
        <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-glass rounded-full p-3 transition">
          ⚙️
        </button>
      </div>

      <div className="space-y-6">
        {/* Total Balance */}
        <div>
          <p className="text-sm opacity-75">Total Balance</p>
          <h2 className="text-4xl font-bold">{formatCurrency(balance)}</h2>
        </div>

        {/* Monthly Salary Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-10 rounded-2xl p-4">
            <p className="text-xs opacity-75">Monthly Salary</p>
            <p className="text-xl font-bold">{formatCurrency(monthlySalary)}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-2xl p-4">
            <p className="text-xs opacity-75">This Month Status</p>
            <p className="text-xl font-bold">Not Credited</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
