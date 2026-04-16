import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from './store/financeStore';
import { HomePage } from './pages/HomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { InsightsPage } from './pages/InsightsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { ChatWidget } from './components/ChatWidget';
import { LoginPage } from './pages/LoginPage';
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

  if (!store.isAuthenticated) {
    return (
      <div className="bg-surface-container-lowest text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen overflow-x-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_#11192e_0%,_#000000_100%)]">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full animate-orbit"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-secondary/5 rounded-full animate-orbit" style={{animationDirection: "reverse", animationDuration: "45s"}}></div>
        </div>
        <div className="relative max-w-2xl mx-auto z-10 pt-20">
          <LoginPage />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_#11192e_0%,_#000000_100%)]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full animate-orbit"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-secondary/5 rounded-full animate-orbit" style={{animationDirection: "reverse", animationDuration: "45s"}}></div>
      </div>

      <Header />

      {/* Content */}
      <div className="relative z-10">
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
          className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary text-surface-lowest shadow-[0_0_20px_rgba(129,236,255,0.4)] flex items-center justify-center text-3xl z-40 hover:scale-110 transition-transform"
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
          onSendMessage={store.chatWithFriday}
        />

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

export default App;
