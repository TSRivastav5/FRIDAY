import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
const PUSH_STORAGE_KEY = 'friday_push_subscribed';

async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('not_supported');
  }

  // DON'T re-request if already denied — browser won't show prompt anyway
  if (Notification.permission === 'denied') {
    throw new Error('denied');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('denied');
  }

  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await api.getVapidPublicKey();
  if (!publicKey) throw new Error('server_error');

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
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

// Detect the browser for "how to unblock" instructions
function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'your browser';
}

function getUnblockInstructions() {
  const name = getBrowserName();
  const base = `Notifications are blocked for this site.`;
  if (name === 'Chrome' || name === 'Edge') {
    return `${base} Click the 🔒 lock icon in the address bar → Site settings → Notifications → Allow.`;
  }
  if (name === 'Firefox') {
    return `${base} Click the shield icon in the address bar → Permissions → Notifications → Allow.`;
  }
  if (name === 'Safari') {
    return `${base} Go to Safari → Settings → Websites → Notifications → find this site → Allow.`;
  }
  return `${base} Open your browser's site settings and allow notifications for this site.`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const store = useFinanceStore();

  const userName = store.user?.name || 'Rahul Kapoor';
  const userEmail = store.user?.email || 'rahul.kapoor@friday.ai';

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(
    !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  );

  // ── Push state ─────────────────────────────────────────────────────────────
  // permissionState: 'default' | 'granted' | 'denied' | 'not_supported'
  const [permissionState, setPermissionState] = useState('default');
  const [pushEnabled, setPushEnabled] = useState(
    localStorage.getItem(PUSH_STORAGE_KEY) === 'true'
  );
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(''); // 'success' | 'error' | 'blocked' | ''
  const [pushMessage, setPushMessage] = useState('');
  const [showUnblockTip, setShowUnblockTip] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Read real browser permission on mount and keep in sync
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('not_supported');
      return;
    }
    setPermissionState(Notification.permission);

    // If previously stored as enabled but permission is now denied, clean up
    if (Notification.permission === 'denied') {
      localStorage.removeItem(PUSH_STORAGE_KEY);
      setPushEnabled(false);
    }

    // Also verify actual SW subscription matches
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          localStorage.removeItem(PUSH_STORAGE_KEY);
          setPushEnabled(false);
        }
      });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "To install FRIDAY on your device:\n\n1. Tap the Share button in Safari (iOS) or browser settings menu\n2. Select 'Add to Home Screen'\n3. Open from your home screen for standalone wealth command experience."
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleLogout = () => store.logout();
  const handleOpenSalaryRules = () => store.setSalaryModal(true);

  const clearStatus = () => {
    setTimeout(() => {
      setPushStatus('');
      setPushMessage('');
      setShowUnblockTip(false);
    }, 6000);
  };

  const handlePushToggle = useCallback(async () => {
    // If browser has permanently blocked, show unblock instructions
    if (permissionState === 'denied') {
      setShowUnblockTip(true);
      setPushStatus('blocked');
      setPushMessage(getUnblockInstructions());
      clearStatus();
      return;
    }

    setPushLoading(true);
    setPushStatus('');
    setPushMessage('');
    setShowUnblockTip(false);

    try {
      if (pushEnabled) {
        await unsubscribePush();
        setPushEnabled(false);
        setPermissionState(Notification.permission);
        setPushStatus('success');
        setPushMessage('Smart Alerts turned off.');
      } else {
        await subscribePush();
        setPushEnabled(true);
        setPermissionState('granted');
        setPushStatus('success');
        setPushMessage("Smart Alerts ON! You'll get real-time salary & spend notifications.");
      }
    } catch (err) {
      if (err.message === 'denied') {
        setPermissionState('denied');
        setPushEnabled(false);
        localStorage.removeItem(PUSH_STORAGE_KEY);
        setPushStatus('blocked');
        setShowUnblockTip(true);
        setPushMessage(getUnblockInstructions());
      } else if (err.message === 'not_supported') {
        setPushStatus('error');
        setPushMessage('Push notifications are not supported in this browser.');
      } else if (err.message === 'server_error') {
        setPushStatus('error');
        setPushMessage('Server not configured for push yet. Add VAPID keys on Render.');
      } else {
        setPushStatus('error');
        setPushMessage(err.message || 'Could not update notification settings.');
      }
    } finally {
      setPushLoading(false);
      clearStatus();
    }
  }, [pushEnabled, permissionState]);

  const notifSupported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  // Derive display state
  const isBlocked = permissionState === 'denied';
  const toggleDisabled = !notifSupported || pushLoading;

  // Sub-label under Smart Alerts
  const getSubLabel = () => {
    if (!notifSupported) return 'Not supported in this browser';
    if (isBlocked) return 'Blocked — tap for instructions to unblock';
    if (pushEnabled) return 'Real-time push — salary & spend alerts active';
    return 'Tap to enable background notifications';
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

        <div className="grid grid-cols-1 gap-6">
          {/* Financial Rules Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest pl-1 text-left">Financial Rules</h3>
            <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
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

              {/* PocketPin Management Row */}
              <button
                onClick={() => setShowPinModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">key</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">PocketPin Security</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Change your 4-digit security PIN</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              {/* ─── Smart Alerts Row ──────────────────────────────────── */}
              <div
                id="smart-alerts-toggle"
                className={`w-full flex items-center justify-between p-4 transition-colors border-b border-outline-variant/10 ${
                  isBlocked
                    ? 'cursor-pointer hover:bg-error/5'
                    : notifSupported && !pushLoading
                    ? 'cursor-pointer hover:bg-surface-container'
                    : ''
                }`}
                onClick={!toggleDisabled ? handlePushToggle : undefined}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isBlocked
                        ? 'bg-error/10 text-error'
                        : pushEnabled
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-secondary/10 text-secondary/60'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {isBlocked
                        ? 'notifications_off'
                        : pushEnabled
                        ? 'notifications_active'
                        : 'notifications'}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Smart Alerts</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold ${
                        isBlocked ? 'text-error/80' : 'text-on-surface-variant'
                      }`}
                    >
                      {getSubLabel()}
                    </span>
                  </div>
                </div>

                {/* Toggle pill or blocked icon */}
                {notifSupported && (
                  isBlocked ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-error/10 border border-error/20">
                      <span className="material-symbols-outlined text-error text-[14px]">lock</span>
                      <span className="text-[9px] font-bold text-error uppercase tracking-wider">Blocked</span>
                    </div>
                  ) : (
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
                  )
                )}
              </div>

              {/* ─── Status / Unblock tip banner ─────────────────────────── */}
              {pushMessage && (
                <div
                  className={`mx-4 mb-3 px-4 py-3 rounded-xl text-xs font-medium leading-relaxed transition-all ${
                    pushStatus === 'blocked'
                      ? 'bg-error/8 text-error border border-error/20'
                      : pushStatus === 'error'
                      ? 'bg-error/8 text-error border border-error/20'
                      : 'bg-secondary/10 text-secondary border border-secondary/20'
                  }`}
                >
                  {pushStatus === 'blocked' && (
                    <div className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">info</span>
                      <span>{pushMessage}</span>
                    </div>
                  )}
                  {pushStatus !== 'blocked' && pushMessage}
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
                      <span className="text-sm font-bold block text-primary">Install FRIDAY App</span>
                      <span className="text-[10px] text-primary/80 uppercase tracking-wider font-semibold">Enable offline wealth management</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary">download</span>
                </button>
              )}
            </div>
          </div>

          {/* Reset Allocations */}
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

        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] font-semibold text-on-surface-variant opacity-50 uppercase tracking-wider">FRIDAY Premium v4.3.0</p>
        </div>
      </main>

      {/* PocketPin Update Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-premium relative text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-on-surface font-headline">Update Security PIN</h3>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setNewPin('');
                    setConfirmPin('');
                    setPinError('');
                  }}
                  className="text-outline hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {pinError && (
                <div className="p-2.5 mb-4 bg-error-container text-error rounded-xl text-xs font-semibold border border-error/20 text-center">
                  ⚠️ {pinError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-outline uppercase tracking-wider ml-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewPin(val);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-mono text-center tracking-widest text-lg"
                    placeholder="••••"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-outline uppercase tracking-wider ml-1">Confirm New PIN</label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmPin(val);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-mono text-center tracking-widest text-lg"
                    placeholder="••••"
                    required
                  />
                </div>

                <button
                  onClick={async () => {
                    if (newPin.length !== 4 || confirmPin.length !== 4) {
                      setPinError("PIN must be exactly 4 digits");
                      return;
                    }
                    if (newPin !== confirmPin) {
                      setPinError("PINs do not match");
                      return;
                    }
                    setIsUpdatingPin(true);
                    setPinError('');
                    try {
                      await store.setPin(newPin);
                      alert("Security PIN updated successfully!");
                      setShowPinModal(false);
                      setNewPin('');
                      setConfirmPin('');
                    } catch (err) {
                      setPinError(err.message || "Failed to update PIN");
                    } finally {
                      setIsUpdatingPin(false);
                    }
                  }}
                  disabled={isUpdatingPin}
                  className="w-full py-3 mt-2 bg-primary hover:bg-primary-hover text-white font-bold tracking-widest uppercase text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  {isUpdatingPin ? "Updating..." : "Confirm PIN Update"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
