import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from './store/financeStore';
import { HomePage } from './pages/HomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { AskAiPage } from './pages/AskAiPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { SalaryModal } from './components/SalaryModal';
import { LockScreen } from './components/LockScreen';
import { OnboardingWizard } from './pages/OnboardingWizard';
import './index.css';

function App() {
  const store = useFinanceStore();

  useEffect(() => {
    // Check system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch user's data whenever we transition into an authenticated, unlocked state
  // (covers both initial login and unlocking the lock screen)
  useEffect(() => {
    if (store.isAuthenticated && !store.isLocked) {
      store.fetchCurrentSalary?.();
      store.fetchInvestments?.();
      store.fetchExpenses?.();
    }
  }, [store.isAuthenticated, store.isLocked]);

  const renderPage = () => {
    switch (store.activeTab) {
      case 'home':
        return <HomePage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'ask_ai':
        return <AskAiPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  if (!store.isAuthenticated) {
    // LoginPage owns its own full-bleed background (shader + ambient
    // blooms) — no separate wrapper background needed here.
    return <LoginPage />;
  }

  // 1. Lock screen guard for returning users
  if (store.isLocked) {
    return <LockScreen />;
  }

  // 2. Loading state splash screen while checking current month's record
  if (store.isLoading && !store.salary) {
    return (
      <div className="fixed inset-0 bg-background text-on-surface flex flex-col justify-center items-center gap-4 z-[250]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold animate-pulse">Initializing FRIDAY Protocols...</p>
      </div>
    );
  }

  // 3. Forced onboarding wizard for first-time users (no salary created and no profile setup done)
  const hasOnboarded = store.user?.financialProfile?.monthlySalary > 0;
  if (!store.salary && !hasOnboarded) {
    return <OnboardingWizard />;
  }

  // Calculate dynamic default allocation values for the modal
  const emi = store.currentAllocation?.emi ?? 0;
  const sip = store.currentAllocation?.sip ?? 0;
  const rent = store.currentAllocation?.rent ?? 0;
  const travel = store.currentAllocation?.travel ?? 0;
  const bills = store.currentAllocation?.bills ?? 0;
  const totalSalary = store.salary?.amount || 0;
  
  const currentAllocation = store.currentAllocation || {
    salary: totalSalary,
    emi,
    rent,
    travel,
    sip,
    bills
  };

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen overflow-x-hidden">
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

        {/* Bottom Navigation */}
        <BottomNav />
      </div>

      <SalaryModal
        isOpen={store.showSalaryModal}
        onClose={() => store.setSalaryModal(false)}
        onSubmit={store.updateAllocation}
        currentAllocation={currentAllocation}
      />
    </div>
  );
}

export default App;
