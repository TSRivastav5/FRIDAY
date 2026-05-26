import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

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

// ─── Sub-Screen Header Component ─────────────────────────────────────────────
const SubScreenHeader = ({ title, onBack }) => (
  <header className="bg-inverse-surface w-full pt-12 pb-4 px-5 sticky top-0 z-50 text-on-primary">
    <div className="max-w-xl mx-auto flex items-center gap-4">
      <button 
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-on-primary">arrow_back</span>
      </button>
      <h2 className="text-lg font-bold text-on-primary">{title}</h2>
    </div>
  </header>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const store = useFinanceStore();

  const userName = store.user?.name || 'Rahul Kapoor';
  const userEmail = store.user?.email || 'rahul.kapoor@friday.ai';

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(
    !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  );

  // ── Sub-screens state ──────────────────────────────────────────────────────
  const [activeSubScreen, setActiveSubScreen] = useState(null); // 'salary' | 'emi' | 'sip' | 'budget' | null

  // ── Push state ─────────────────────────────────────────────────────────────
  const [permissionState, setPermissionState] = useState('default');
  const [pushEnabled, setPushEnabled] = useState(
    localStorage.getItem(PUSH_STORAGE_KEY) === 'true'
  );
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(''); // 'success' | 'error' | 'blocked' | ''
  const [pushMessage, setPushMessage] = useState('');
  const [showUnblockTip, setShowUnblockTip] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockTab, setUnblockTab] = useState('Chrome');

  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Financial Profile Form States ──────────────────────────────────────────
  const profile = store.user?.financialProfile || {};

  // Salary rules sub-screen fields
  const [salSalary, setSalSalary] = useState('');
  const [salDay, setSalDay] = useState(1);
  const [salBank, setSalBank] = useState('');
  const [salAutoSplit, setSalAutoSplit] = useState(true);

  // EMI setup sub-screen fields
  const [emiLabel, setEmiLabel] = useState('');
  const [emiLender, setEmiLender] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [emiDueDate, setEmiDueDate] = useState(5);
  const [emiEndMonth, setEmiEndMonth] = useState('');
  const [emiType, setEmiType] = useState('home');
  const [editingEmiId, setEditingEmiId] = useState(null);

  // SIP setup sub-screen fields
  const [sipFundName, setSipFundName] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [sipDate, setSipDate] = useState(10);
  const [sipLinked, setSipLinked] = useState(true);

  // Travel & Bills Budget limits fields
  const [budTravel, setBudTravel] = useState('');
  const [budBills, setBudBills] = useState('');

  // Sync profile values to local states
  useEffect(() => {
    if (store.user?.financialProfile) {
      const prof = store.user.financialProfile;
      setSalSalary(prof.monthlySalary || '');
      setSalDay(prof.salaryDay || 1);
      setSalBank(prof.bankAccount || 'HDFC Bank');
      setSalAutoSplit(prof.autoSplit !== false);
      setBudTravel(prof.travelDefault || '');
      setBudBills(prof.billsDefault || '');
    }
  }, [store.user?.financialProfile]);

  // Load investments on mount (specifically SIPs)
  useEffect(() => {
    store.fetchInvestments?.();
  }, []);

  // Sync permissions on mount
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('not_supported');
      return;
    }
    setPermissionState(Notification.permission);

    if (Notification.permission === 'denied') {
      localStorage.removeItem(PUSH_STORAGE_KEY);
      setPushEnabled(false);
    }

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

  // ── Helper functions for dates ─────────────────────────────────────────────
  const getNextDate = (day) => {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    if (today.getDate() > day) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return new Date(year, month, day);
  };

  const toMonthInputValue = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthYearLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

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

  const clearStatus = () => {
    setTimeout(() => {
      setPushStatus('');
      setPushMessage('');
      setShowUnblockTip(false);
    }, 6000);
  };

  const handlePushToggle = useCallback(async () => {
    if (permissionState === 'denied') {
      setShowUnblockModal(true);
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
        setShowUnblockModal(true);
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

  const isBlocked = permissionState === 'denied';
  const toggleDisabled = !notifSupported || pushLoading;

  const getSubLabel = () => {
    if (!notifSupported) return 'Not supported in this browser';
    if (isBlocked) return 'Blocked — tap for instructions to unblock';
    if (pushEnabled) return 'Real-time push — salary & spend alerts active';
    return 'Tap to enable background notifications';
  };

  // ── Financial Profile Save Handlers ────────────────────────────────────────
  const handleSaveSalaryRules = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = {
        ...profile,
        monthlySalary: parseFloat(salSalary) || 0,
        salaryDay: parseInt(salDay, 10),
        bankAccount: salBank || 'HDFC Bank',
        autoSplit: salAutoSplit,
      };
      await store.updateProfile(updatedProfile);
      alert("Salary rules saved successfully!");
      setActiveSubScreen(null);
    } catch (err) {
      alert("Failed to update salary rules: " + err.message);
    }
  };

  const handleSaveEmi = async (e) => {
    e.preventDefault();
    if (!emiLabel || !emiAmount || !emiEndMonth) {
      alert("Please fill in all required fields.");
      return;
    }

    const newEmi = {
      name: emiLabel,
      lender: emiLender || "Generic Lender",
      amount: parseFloat(emiAmount) || 0,
      dueDate: parseInt(emiDueDate, 10),
      endDate: new Date(emiEndMonth + "-02"), // Offsetting date to prevent tz drop
      type: emiType,
    };

    let updatedEmis = [...(profile.fixedExpenses?.emis || [])];
    if (editingEmiId !== null) {
      updatedEmis = updatedEmis.map((item, idx) => 
        (item._id === editingEmiId || idx === editingEmiId) ? { ...item, ...newEmi } : item
      );
    } else {
      updatedEmis.push(newEmi);
    }

    const totalEmiDefault = updatedEmis.reduce((sum, item) => sum + item.amount, 0);

    const updatedProfile = {
      ...profile,
      fixedExpenses: {
        ...profile.fixedExpenses,
        emis: updatedEmis,
        emiDefault: totalEmiDefault,
      }
    };

    try {
      await store.updateProfile(updatedProfile);
      alert(editingEmiId !== null ? "EMI commitment updated!" : "EMI commitment added!");
      setEmiLabel('');
      setEmiLender('');
      setEmiAmount('');
      setEmiDueDate(5);
      setEmiEndMonth('');
      setEmiType('home');
      setEditingEmiId(null);
    } catch (err) {
      alert("Failed to save EMI: " + err.message);
    }
  };

  const handleStartEditEmi = (emiItem, idx) => {
    setEditingEmiId(emiItem._id || idx);
    setEmiLabel(emiItem.name);
    setEmiLender(emiItem.lender || '');
    setEmiAmount(emiItem.amount);
    setEmiDueDate(emiItem.dueDate || 5);
    setEmiEndMonth(toMonthInputValue(emiItem.endDate));
    setEmiType(emiItem.type || 'home');
  };

  const handleDeleteEmi = async (emiItem, idx) => {
    if (!window.confirm("Are you sure you want to remove this EMI commitment?")) return;

    const updatedEmis = (profile.fixedExpenses?.emis || []).filter(
      (item, i) => item._id !== emiItem._id && i !== idx
    );
    const totalEmiDefault = updatedEmis.reduce((sum, item) => sum + item.amount, 0);

    const updatedProfile = {
      ...profile,
      fixedExpenses: {
        ...profile.fixedExpenses,
        emis: updatedEmis,
        emiDefault: totalEmiDefault,
      }
    };

    try {
      await store.updateProfile(updatedProfile);
    } catch (err) {
      alert("Failed to delete EMI: " + err.message);
    }
  };

  const handleAddSip = async (e) => {
    e.preventDefault();
    if (!sipFundName || !sipAmount) {
      alert("Please fill in all required fields.");
      return;
    }

    const deductionDay = parseInt(sipDate, 10);
    const nextDate = getNextDate(deductionDay);

    const sipData = {
      name: sipFundName,
      type: "sip",
      investedAmount: parseFloat(sipAmount) || 0,
      currentValue: parseFloat(sipAmount) || 0,
      tags: sipLinked ? ["linked_to_salary"] : [],
      sipDetails: {
        monthlyAmount: parseFloat(sipAmount) || 0,
        startDate: new Date(),
        nextDate: nextDate,
      }
    };

    try {
      await store.addInvestment(sipData);
      alert("SIP configuration added successfully!");
      
      // Update profile sipDefault sum
      setTimeout(async () => {
        const activeSips = (store.investments || []).filter(inv => inv.type === 'sip' && inv.isActive !== false);
        const newTotalSip = activeSips.reduce((sum, s) => sum + s.investedAmount, 0) + sipData.investedAmount;
        await store.updateProfile({
          ...profile,
          sipDefault: newTotalSip
        });
      }, 150);

      setSipFundName('');
      setSipAmount('');
      setSipDate(10);
      setSipLinked(true);
    } catch (err) {
      alert("Failed to save SIP: " + err.message);
    }
  };

  const handleDeleteSip = async (id) => {
    if (!window.confirm("Are you sure you want to remove this SIP?")) return;

    try {
      await store.deleteInvestment(id);
      
      // Recalculate sipDefault sum
      setTimeout(async () => {
        const activeSips = (store.investments || []).filter(inv => inv.type === 'sip' && inv.isActive !== false && inv._id !== id);
        const newTotalSip = activeSips.reduce((sum, s) => sum + s.investedAmount, 0);
        await store.updateProfile({
          ...profile,
          sipDefault: newTotalSip
        });
      }, 150);
    } catch (err) {
      alert("Failed to delete SIP: " + err.message);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = {
        ...profile,
        travelDefault: parseFloat(budTravel) || 0,
        billsDefault: parseFloat(budBills) || 0,
      };
      await store.updateProfile(updatedProfile);
      alert("Budgets updated successfully!");
      setActiveSubScreen(null);
    } catch (err) {
      alert("Failed to save budgets: " + err.message);
    }
  };

  const activeSipsList = (store.investments || []).filter(
    (inv) => inv.type === 'sip' && inv.isActive !== false
  );

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
                onClick={() => setActiveSubScreen('salary')}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Salary rules</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      Monthly Salary: {formatCurrency(profile.monthlySalary || 0)}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              <button
                onClick={() => setActiveSubScreen('emi')}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined">credit_score</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">EMI setup</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      {(profile.fixedExpenses?.emis || []).length} active commitments
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              <button
                onClick={() => setActiveSubScreen('sip')}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors border-b border-outline-variant/10 active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">energy_savings_leaf</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">SIP configuration</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      {activeSipsList.length} active SIPs
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </button>

              <button
                onClick={() => setActiveSubScreen('budget')}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors active:scale-[0.99] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-on-surface">Travel &amp; Bills budget</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      Limit: {formatCurrency((profile.travelDefault || 0) + (profile.billsDefault || 0))} / month
                    </span>
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

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full mt-2 flex items-center justify-center gap-2 p-4 text-white font-bold bg-error hover:bg-error/90 border border-error/10 rounded-xl transition-colors active:scale-95 shadow-md shadow-error/10 text-sm"
          >
            <span className="material-symbols-outlined">delete_forever</span>
            <span>Delete Account Permanently</span>
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

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-premium relative text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-error font-headline">Delete Account Irreversibly?</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="text-outline hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-error/5 text-error text-xs rounded-xl border border-error/10 leading-relaxed font-semibold">
                  ⚠️ WARNING: This will permanently delete your user profile and nuke all your tracked incomes, budgets, investments, and advisor chat logs. This action cannot be undone.
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-on-surface-variant font-semibold">
                    Type <strong className="text-error select-all">DELETE</strong> in the box below to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-error/20 focus:border-error focus:outline-none transition-all text-sm bg-background text-center font-bold tracking-wider"
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 py-3 border border-outline-variant/40 hover:bg-background text-on-surface font-semibold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (deleteConfirmText !== "DELETE") {
                        alert("Please type 'DELETE' exactly to confirm account removal.");
                        return;
                      }
                      try {
                        await store.deleteAccount();
                        alert("Your account has been deleted successfully.");
                      } catch (err) {
                        alert(err.message || "Failed to delete account");
                      }
                    }}
                    disabled={deleteConfirmText !== "DELETE"}
                    className="flex-1 py-3 bg-error hover:bg-error/95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Push Alerts: Interactive Unblock Modal ───────────────────────── */}
      <AnimatePresence>
        {showUnblockModal && (
          <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined">notifications_off</span>
                  <h3 className="text-base font-bold font-headline">Enable Notifications</h3>
                </div>
                <button
                  onClick={() => setShowUnblockModal(false)}
                  className="text-outline hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Notifications are blocked for this site. To receive real-time credit updates and spending advice, follow the step-by-step instructions for your browser below:
                </p>

                {/* Tab selector */}
                <div className="flex border-b border-outline-variant/20 gap-1 overflow-x-auto pb-1">
                  {['Chrome', 'Safari', 'Firefox', 'Edge', 'iOS / PWA'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setUnblockTab(tab)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                        unblockTab === tab
                          ? 'bg-primary text-white'
                          : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/15 text-xs text-on-surface leading-relaxed min-h-[120px]">
                  {unblockTab === 'Chrome' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Click the **🔒 lock icon** on the left of the address bar.</li>
                      <li>Find **Notifications** in the dropdown.</li>
                      <li>Toggle the switch to **Allow**.</li>
                      <li>Refresh the page to apply changes.</li>
                    </ol>
                  )}
                  {unblockTab === 'Safari' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Go to **Safari** in top menu → **Settings** (or Preferences).</li>
                      <li>Click the **Websites** tab, then select **Notifications**.</li>
                      <li>Locate **FRIDAY** in the website list.</li>
                      <li>Change the option from Deny to **Allow**.</li>
                    </ol>
                  )}
                  {unblockTab === 'Firefox' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Click the **permissions/shield icon** to the left of the URL.</li>
                      <li>Click the **X** next to *Allowed/Blocked* status for Notifications.</li>
                      <li>Refresh the page.</li>
                      <li>Click **Allow** when the notification prompt pops up.</li>
                    </ol>
                  )}
                  {unblockTab === 'Edge' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Click the **🔒 lock icon** in the address bar.</li>
                      <li>Select **Permissions for this site**.</li>
                      <li>Locate **Notifications** and set to **Allow**.</li>
                      <li>Reload the page to confirm.</li>
                    </ol>
                  )}
                  {unblockTab === 'iOS / PWA' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>First, ensure you have **Installed** FRIDAY to your home screen (tap the Share icon → Add to Home Screen).</li>
                      <li>Launch **FRIDAY** from your home screen.</li>
                      <li>Go to iOS **Settings** → **Notifications** → **FRIDAY**.</li>
                      <li>Ensure **Allow Notifications** is enabled.</li>
                      <li>Return to the app and click the Smart Alerts toggle.</li>
                    </ol>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnblockModal(false)}
                    className="flex-1 py-2.5 border border-outline-variant/40 hover:bg-background text-on-surface font-semibold text-xs rounded-xl transition-all text-center"
                  >
                    Close Guide
                  </button>
                  <button
                    onClick={async () => {
                      setShowUnblockModal(false);
                      try {
                        const perm = await Notification.requestPermission();
                        setPermissionState(perm);
                        if (perm === 'granted') {
                          await subscribePush();
                          setPushEnabled(true);
                          alert("Notifications configured successfully!");
                        } else {
                          alert("Permission still blocked. Please follow the instructions to allow notifications.");
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
                  >
                    Try Trigger Prompt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SLIDE-OVER SUB-SCREENS ─────────────────────────────────────────── */}
      <AnimatePresence>
        {/* 1. Salary Rules Sub-screen */}
        {activeSubScreen === 'salary' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[150] bg-surface overflow-y-auto pb-12 flex flex-col"
          >
            <SubScreenHeader title="Salary Rules" onBack={() => setActiveSubScreen(null)} />
            
            <main className="max-w-xl mx-auto w-full px-5 pt-6 text-left space-y-6">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Configure your base monthly income and credit date. FRIDAY uses this to automate your expense allocations and compute savings potential when a credit is detected.
              </p>

              <form onSubmit={handleSaveSalaryRules} className="space-y-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/25 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Monthly Salary (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-semibold text-on-surface-variant text-sm">₹</span>
                    <input
                      type="number"
                      value={salSalary}
                      onChange={(e) => setSalSalary(e.target.value)}
                      placeholder="e.g. 75000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-bold text-on-surface"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Salary Credit Day</label>
                  <select
                    value={salDay}
                    onChange={(e) => setSalDay(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-bold text-on-surface"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                        {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Bank Account</label>
                  <input
                    type="text"
                    value={salBank}
                    onChange={(e) => setSalBank(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-bold text-on-surface"
                    required
                  />
                </div>

                {/* Auto-split toggle */}
                <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
                  <div className="text-left pr-4">
                    <span className="text-sm font-semibold block text-on-surface">Auto-split allocations</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">Split budget immediately upon salary credit detection</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSalAutoSplit(!salAutoSplit)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      salAutoSplit ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        salAutoSplit ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold tracking-widest uppercase text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  Save Salary Rules
                </button>
              </form>
            </main>
          </motion.div>
        )}

        {/* 2. EMI Setup Sub-screen */}
        {activeSubScreen === 'emi' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[150] bg-surface overflow-y-auto pb-12 flex flex-col"
          >
            <SubScreenHeader title="EMI Setup" onBack={() => setActiveSubScreen(null)} />

            <main className="max-w-xl mx-auto w-full px-5 pt-6 text-left space-y-6">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Add your active monthly debt obligations. These fixed charges are prioritised during salary credit allocation.
              </p>

              {/* Form to Add/Edit EMI */}
              <form onSubmit={handleSaveEmi} className="space-y-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/25 shadow-sm">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  {editingEmiId !== null ? 'Edit EMI Commitment' : 'Add New EMI commitment'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">EMI Label</label>
                    <input
                      type="text"
                      value={emiLabel}
                      onChange={(e) => setEmiLabel(e.target.value)}
                      placeholder="e.g. Home loan, Car loan"
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Bank / Lender</label>
                    <input
                      type="text"
                      value={emiLender}
                      onChange={(e) => setEmiLender(e.target.value)}
                      placeholder="e.g. SBI, HDFC"
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Monthly Amount (₹)</label>
                    <input
                      type="number"
                      value={emiAmount}
                      onChange={(e) => setEmiAmount(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-bold text-on-surface"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Due Date</label>
                    <select
                      value={emiDueDate}
                      onChange={(e) => setEmiDueDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>Day {day} of the month</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">End Month/Year</label>
                    <input
                      type="month"
                      value={emiEndMonth}
                      onChange={(e) => setEmiEndMonth(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Loan Type</label>
                    <select
                      value={emiType}
                      onChange={(e) => setEmiType(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                    >
                      <option value="home">Home Loan</option>
                      <option value="car">Car Loan</option>
                      <option value="personal">Personal Loan</option>
                      <option value="education">Education Loan</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold tracking-wider uppercase text-[10px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    {editingEmiId !== null ? 'Update Commitment' : 'Add EMI Commitment'}
                  </button>
                  {editingEmiId !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmiId(null);
                        setEmiLabel('');
                        setEmiLender('');
                        setEmiAmount('');
                        setEmiDueDate(5);
                        setEmiEndMonth('');
                        setEmiType('home');
                      }}
                      className="px-4 py-2.5 border border-outline-variant/40 hover:bg-background text-on-surface font-semibold text-[10px] tracking-wider uppercase rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* List of Active EMIs */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Active Commitments List</h3>
                
                {!(profile.fixedExpenses?.emis?.length) ? (
                  <div className="text-center py-8 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-on-surface-variant text-xs font-medium uppercase tracking-wider">
                    No active EMIs configured
                  </div>
                ) : (
                  (profile.fixedExpenses?.emis || []).map((emiItem, idx) => (
                    <div key={emiItem._id || idx} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between hover:border-primary transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-on-surface">{emiItem.name}</span>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-outline-variant/30 text-on-surface-variant">
                            {emiItem.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-semibold tracking-wider">
                          Lender: {emiItem.lender || 'Generic'} · Due: {emiItem.dueDate || 5}th · Ends: {getMonthYearLabel(emiItem.endDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-error">-{formatCurrency(emiItem.amount)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditEmi(emiItem, idx)}
                            className="p-1 rounded text-outline hover:text-primary hover:bg-primary/5"
                            title="Edit EMI"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEmi(emiItem, idx)}
                            className="p-1 rounded text-outline hover:text-error hover:bg-error/5"
                            title="Delete EMI"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </main>
          </motion.div>
        )}

        {/* 3. SIP Configuration Sub-screen */}
        {activeSubScreen === 'sip' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[150] bg-surface overflow-y-auto pb-12 flex flex-col"
          >
            <SubScreenHeader title="SIP Configuration" onBack={() => setActiveSubScreen(null)} />

            <main className="max-w-xl mx-auto w-full px-5 pt-6 text-left space-y-6">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Set up active Systematic Investment Plans. These are classified as investments and tracked within your net wealth telemetry metrics.
              </p>

              {/* Form to Add SIP */}
              <form onSubmit={handleAddSip} className="space-y-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/25 shadow-sm">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Create New SIP</h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Fund Name</label>
                  <input
                    type="text"
                    value={sipFundName}
                    onChange={(e) => setSipFundName(e.target.value)}
                    placeholder="e.g. Parag Parikh Flexi Cap, Axis Bluechip"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Monthly Amount (₹)</label>
                    <input
                      type="number"
                      value={sipAmount}
                      onChange={(e) => setSipAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-bold text-on-surface"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Deduction Date</label>
                    <select
                      value={sipDate}
                      onChange={(e) => setSipDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-xs bg-background font-semibold text-on-surface"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>Day {day} of the month</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Linked to salary toggle */}
                <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
                  <div className="text-left pr-4">
                    <span className="text-sm font-semibold block text-on-surface">Link with salary cycle</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">Auto-reserve this SIP amount when monthly salary is credited</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSipLinked(!sipLinked)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      sipLinked ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        sipLinked ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold tracking-widest uppercase text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Save SIP
                </button>
              </form>

              {/* List of Active SIPs */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Active SIPs List</h3>

                {activeSipsList.length === 0 ? (
                  <div className="text-center py-8 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-on-surface-variant text-xs font-medium uppercase tracking-wider">
                    No active SIP configurations found
                  </div>
                ) : (
                  activeSipsList.map((sipItem) => (
                    <div key={sipItem._id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between hover:border-primary transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-on-surface">{sipItem.name}</span>
                          {sipItem.tags?.includes('linked_to_salary') && (
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-tertiary-fixed/20 border border-tertiary/10 text-on-tertiary-fixed-variant">
                              Salary Linked
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-semibold tracking-wider">
                          Deduction Date: {sipItem.sipDetails?.nextDate ? new Date(sipItem.sipDetails.nextDate).getDate() : 10}th of the month
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-tertiary">{formatCurrency(sipItem.investedAmount)}</span>
                        <button
                          onClick={() => handleDeleteSip(sipItem._id)}
                          className="p-1 rounded text-outline hover:text-error hover:bg-error/5"
                          title="Delete SIP"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </main>
          </motion.div>
        )}

        {/* 4. Travel & Bills Budget Limits Sub-screen */}
        {activeSubScreen === 'budget' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[150] bg-surface overflow-y-auto pb-12 flex flex-col"
          >
            <SubScreenHeader title="Budget Limits" onBack={() => setActiveSubScreen(null)} />

            <main className="max-w-xl mx-auto w-full px-5 pt-6 text-left space-y-6">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Define monthly expense limits for Travel and Bills. These are used to populate your Home dashboard cards and warning thresholds.
              </p>

              <form onSubmit={handleSaveBudget} className="space-y-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/25 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Monthly Travel Budget (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-semibold text-on-surface-variant text-sm">₹</span>
                    <input
                      type="number"
                      value={budTravel}
                      onChange={(e) => setBudTravel(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-bold text-on-surface"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider pl-1">Monthly Bills &amp; Utilities Estimate (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-semibold text-on-surface-variant text-sm">₹</span>
                    <input
                      type="number"
                      value={budBills}
                      onChange={(e) => setBudBills(e.target.value)}
                      placeholder="e.g. 8000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-bold text-on-surface"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold tracking-widest uppercase text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  Save Budgets
                </button>
              </form>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
