import React, { useState, useEffect, useCallback } from 'react';
import { useFinanceStore } from '../store/financeStore';
import api from '../services/api';

// ─── Utility: base64 URL decode for VAPID key ────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ─── Push subscription helpers ───────────────────────────────────────────────
const PUSH_STORAGE_KEY = 'finvault_push_subscribed';

async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied.');
  }

  const reg = await navigator.serviceWorker.ready;

  // Fetch VAPID public key from backend
  const { publicKey } = await api.getVapidPublicKey();
  if (!publicKey) throw new Error('Server push configuration missing.');

  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  await api.subscribeToPush(subscription.toJSON());
  localStorage.setItem(PUSH_STORAGE_KEY, 'true');
  return subscription;
}

async function unsubscribePush() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await api.unsubscribeFromPush(sub.endpoint);
    await sub.unsubscribe();
  }
  localStorage.removeItem(PUSH_STORAGE_KEY);
}

// ─── Component ───────────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const store = useFinanceStore();

  const userName = store.user?.name || 'Rahul Kapoor';
  const userEmail = store.user?.email || 'rahul.kapoor@finvault.com';

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(
    !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  );

  // Push state
  const [pushEnabled, setPushEnabled] = useState(
    localStorage.getItem(PUSH_STORAGE_KEY) === 'true'
  );
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(''); // 'success' | 'error' | ''
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Sync push state with actual browser subscription
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        localStorage.removeItem(PUSH_STORAGE_KEY);
        setPushEnabled(false);
      }
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        'To install FinVault on your device:\n\n1. Tap the Share button in Safari (iOS) or browser settings menu\n2. Select \'Add to Home Screen\'\n3. Open from your home screen for standalone wealth command experience.'
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation decision: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleLogout = () => store.logout();
  const handleOpenSalaryRules = () => store.setSalaryModal(true);

  const handlePushToggle = useCallback(async () => {
    setPushLoading(true);
    setPushStatus('');
    setPushMessage('');
    try {
      if (pushEnabled) {
        await unsubscribePush();
        setPushEnabled(false);
        setPushStatus('success');
        setPushMessage('Smart Alerts turned off.');
      } else {
        await subscribePush();
        setPushEnabled(true);
        setPushStatus('success');
        setPushMessage('Smart Alerts enabled! You\'ll get real-time salary and spend alerts.');
      }
    } catch (err) {
      setPushStatus('error');
      setPushMessage(err.message || 'Could not update push notification settings.');
    } finally {
      setPushLoading(false);
      setTimeout(() => { setPushStatus(''); setPushMessage(''); }, 4000);
    }
  }, [pushEnabled]);

  const notifSupported = 'serviceWorker' in navigator && 'PushManager' in window;

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

        <div className="grid grid-cols-1 gap-6">
          {/* Financial Rules Section */}
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

          {/* Security & Connectivity Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest pl-1 text-left">Security &amp; Connectivity</h3>
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

              {/* ─── Smart Alerts — Real Push Notifications ─── */}
              <div
                className={`w-full flex items-center justify-between p-4 border-b border-outline-variant/10 transition-colors ${
                  notifSupported ? 'hover:bg-surface-container cursor-pointer' : 'opacity-60'
                }`}
                onClick={notifSupported && !pushLoading ? handlePushToggle : undefined}
                id="smart-alerts-toggle"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      pushEnabled ? 'bg-secondary/20 text-secondary' : 'bg-secondary/10 text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {pushEnabled ? 'notifications_active' : 'notifications_off'}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Smart Alerts</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      {!notifSupported
                        ? 'Not supported in this browser'
                        : pushEnabled
                        ? 'Real-time push — salary & spend alerts'
                        : 'Tap to enable background notifications'}
                    </span>
                  </div>
                </div>
                {/* Toggle pill */}
                {notifSupported && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!pushLoading) handlePushToggle(); }}
                    disabled={pushLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 ${
                      pushEnabled ? 'bg-secondary' : 'bg-outline-variant'
                    } ${pushLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Toggle smart alerts"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        pushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Push status toast (inline) */}
              {pushMessage && (
                <div
                  className={`mx-4 my-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all animate-pulse ${
                    pushStatus === 'error'
                      ? 'bg-error/10 text-error border border-error/20'
                      : 'bg-secondary/10 text-secondary border border-secondary/20'
                  }`}
                >
                  {pushMessage}
                </div>
              )}

              {/* Install PWA Option */}
              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 transition-colors active:scale-[0.99] duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">install_mobile</span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold block text-primary">Install FinVault App</span>
                      <span className="text-[10px] text-primary/80 uppercase tracking-wider font-semibold">Enable offline wealth management</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary">download</span>
                </button>
              )}
            </div>
          </div>

          {/* Reset Allocations Section */}
          {store.currentAllocation && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to reset all your allocations and salary back to ₹0?')) {
                  await store.resetAllocation();
                  alert('Allocations & salary have been reset successfully.');
                }
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 p-4 text-error font-semibold bg-white border-[0.5px] border-error/25 rounded-xl hover:bg-error/5 transition-colors active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined">restart_alt</span>
              <span>Reset Allocations &amp; Salary</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 p-4 text-error font-semibold bg-error/5 border-[0.5px] border-error/20 rounded-xl hover:bg-error/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>

        {/* App Metadata */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] font-semibold text-on-surface-variant opacity-50 uppercase tracking-wider">FinVault Premium v4.3.0</p>
        </div>
      </main>
    </div>
  );
};
