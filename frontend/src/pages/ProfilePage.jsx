import React from 'react';
import { useFinanceStore } from '../store/financeStore';

export const ProfilePage = () => {
  const store = useFinanceStore();

  const userName = store.user?.name || "Rahul Kapoor";
  const userEmail = store.user?.email || "rahul.kapoor@finvault.com";

  const handleLogout = () => {
    store.logout();
  };

  const handleOpenSalaryRules = () => {
    store.setSalaryModal(true);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-inverse-surface docked full-width top-0 rounded-b-none z-50 sticky">
        <div className="flex justify-between items-center w-full px-5 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-[10px] overflow-hidden">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="text-lg font-bold text-on-primary text-left">Settings</h1>
          </div>
          <button className="text-on-primary opacity-70 hover:opacity-100 transition-all duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pt-6 space-y-6 flex flex-col items-stretch">
        {/* Profile Card */}
        <section className="bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl p-5 flex items-center gap-4 transition-all hover:shadow-sm text-left">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-extrabold text-2xl shadow-inner">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-lg text-white border-2 border-surface-container-lowest cursor-pointer hover:opacity-90">
              <span className="material-symbols-outlined text-[14px]">edit</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface leading-tight">{userName}</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{userEmail}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed/20 border border-tertiary/10">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary"></div>
              <span className="text-[10px] font-semibold text-on-tertiary-fixed-variant uppercase tracking-wider">Premium User</span>
            </div>
          </div>
        </section>

        {/* Bento Menu Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Preferences Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest pl-1 text-left">Financial Rules</h3>
            <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
              {/* Salary Rules */}
              <button 
                onClick={handleOpenSalaryRules}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Salary rules</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Automate savings on credit</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              {/* EMI Setup */}
              <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined">credit_score</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">EMI setup</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">3 active commitments</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              {/* SIP Config */}
              <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors active:scale-[0.99] duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">energy_savings_leaf</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">SIP configuration</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Optimizing for 14.2% YTD</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Connections Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest pl-1 text-left">Security & Connectivity</h3>
            <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
              {/* Linked Banks */}
              <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-on-secondary-fixed-variant/10 flex items-center justify-center text-on-secondary-fixed-variant">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Linked bank accounts</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">HDFC, ICICI, SBI linked</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              {/* Notifications */}
              <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors active:scale-[0.99] duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Notifications</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Smart alerts and reports</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Logout Section */}
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 p-4 text-error font-semibold bg-error/5 border-[0.5px] border-error/20 rounded-xl hover:bg-error/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>

        {/* App Metadata */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] font-semibold text-on-surface-variant opacity-50 uppercase tracking-wider">FinVault Premium v4.2.0</p>
        </div>
      </main>
    </div>
  );
};
