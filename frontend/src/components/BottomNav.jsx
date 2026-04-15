import { motion } from 'framer-motion';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'expenses', icon: '📊', label: 'Expenses' },
    { id: 'investments', icon: '📈', label: 'Investments' },
    { id: 'insights', icon: '💡', label: 'Insights' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-t-3xl shadow-premium"
    >
      <div className="flex justify-around items-center max-w-4xl mx-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-center transition-colors relative group ${
              activeTab === tab.id ? 'text-indigo-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl">{tab.icon}</div>
            <div className="text-xs font-semibold mt-1">{tab.label}</div>
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
