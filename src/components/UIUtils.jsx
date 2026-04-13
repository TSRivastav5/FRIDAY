import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = () => (
  <motion.div
    className="flex justify-center items-center"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-500 rounded-full"></div>
  </motion.div>
);

export const EmptyState = ({ icon = '📭', title = 'No data', description = 'Get started!' }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="text-5xl mb-3">{icon}</div>
    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm">{description}</p>
  </motion.div>
);

export const StatCard = ({ label, value, icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <motion.div
      className={`rounded-2xl p-4 ${colorMap[color]}`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </motion.div>
  );
};
