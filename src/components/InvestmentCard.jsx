import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';

export const InvestmentCard = ({ investment }) => {
  const gain = investment.currentValue - investment.amount;
  const gainPercent = ((gain / investment.amount) * 100).toFixed(2);
  const isPositive = gain >= 0;

  const typeIcons = {
    SIP: '📈',
    Stock: '📊',
    'Mutual Fund': '💼',
    ETF: '🔄',
    Savings: '🏦',
    Crypto: '₿',
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-premium"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-2xl mb-2">{typeIcons[investment.type] || '📈'}</div>
          <h3 className="font-bold">{investment.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{investment.type}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">Invested</div>
          <div className="font-bold">{formatCurrency(investment.amount)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Value</div>
          <div className="font-bold text-lg">{formatCurrency(investment.currentValue)}</div>
        </div>
        <div
          className={`rounded-2xl p-3 text-white ${
            isPositive ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="text-xs opacity-90 mb-1">Gain/Loss</div>
          <div className="font-bold text-lg">{isPositive ? '+' : ''}{formatCurrency(gain)}</div>
          <div className="text-xs opacity-90">({gainPercent}%)</div>
        </div>
      </div>

      {investment.months && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          SIP duration: {investment.months} months
        </div>
      )}
    </motion.div>
  );
};
