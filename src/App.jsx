import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from './store/financeStore';
import { HomePage } from './pages/HomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { InsightsPage } from './pages/InsightsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/BottomNav';
import { ChatWidget } from './components/ChatWidget';
import './index.css';

function App() {
  const store = useFinanceStore();

  useEffect(() => {
    // Check system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const renderPage = () => {
    switch (store.activeTab) {
      case 'home':
        return <HomePage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'insights':
        return <InsightsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pointer-events-none" />

      {/* Content */}
      <div className="relative max-w-2xl mx-auto">
        {/* Main Page */}
        <motion.div
          key={store.activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderPage()}
        </motion.div>

        {/* Floating Chat Button */}
        <motion.button
          onClick={() => store.setChatWidget(!store.showChatWidget)}
          className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-premium flex items-center justify-center text-2xl z-40 hover:shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            y: store.showChatWidget ? 0 : [0, -10, 0],
          }}
          transition={{
            repeat: store.showChatWidget ? 0 : Infinity,
            duration: 2,
          }}
        >
          💬
        </motion.button>

        {/* Chat Widget */}
        <ChatWidget
          isOpen={store.showChatWidget}
          onClose={() => store.setChatWidget(false)}
          messages={store.chatMessages}
          onSendMessage={store.addChatMessage}
        />

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={store.activeTab}
          setActiveTab={store.setActiveTab}
        />
      </div>
    </div>
  );
}

export default App;
