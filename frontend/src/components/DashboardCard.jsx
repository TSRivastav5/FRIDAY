import React from 'react';
import { motion } from 'framer-motion';

export const DashboardCard = ({ icon, title, value, subtitle, onClick, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <motion.div
      onClick={onClick}
      className="cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`bg-gradient-to-br ${colorMap[color]} rounded-3xl p-6 text-white shadow-premium`}>
        <div className="text-4xl mb-3">{icon}</div>
        <div className="text-sm font-semibold opacity-90">{title}</div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        {subtitle && <div className="text-xs opacity-75 mt-2">{subtitle}</div>}
      </div>
    </motion.div>
  );
};
