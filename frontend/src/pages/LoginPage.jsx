import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';

export const LoginPage = () => {
  const store = useFinanceStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'pin'
  const [name, setName] = useState('');
  
  const rememberedEmail = localStorage.getItem("friday_remembered_email") || '';
  const [email, setEmail] = useState(rememberedEmail);
  const [isSwitchedAccount, setIsSwitchedAccount] = useState(false);
  
  const [password, setPassword] = useState('');
  const [pinInput, setPinInput] = useState('');

  const showQuickPin = isLogin && loginMethod === 'pin' && rememberedEmail && !isSwitchedAccount;

  // Sync email to remembered email if changed and we are switching account
  useEffect(() => {
    if (!rememberedEmail) {
      setIsSwitchedAccount(true);
    }
  }, [rememberedEmail]);

  // Handle PIN input keydown events (only when not typing in email input)
  useEffect(() => {
    if (isLogin && loginMethod === 'pin') {
      const handleKeyDown = (e) => {
        const activeEl = document.activeElement;
        const isTypingInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        
        // If typing in email or another text field, don't capture for PIN
        if (isTypingInput && activeEl.type !== 'password' && activeEl.type !== 'pin') {
          return;
        }

        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          handlePinKeyPress(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handlePinBackspace();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLogin, loginMethod, pinInput, email, isSwitchedAccount]);

  // Auto-submit PIN once it reaches 4 digits
  useEffect(() => {
    if (isLogin && loginMethod === 'pin' && pinInput.length === 4) {
      handlePinSubmit();
    }
  }, [pinInput]);

  const handlePinKeyPress = (num) => {
    if (pinInput.length >= 4) return;
    setPinInput(prev => prev + num);
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = async () => {
    if (!email) {
      store.clearError?.();
      // Let Zustand store show a custom validation error
      useFinanceStore.setState({ error: "Please enter your email address first." });
      setPinInput('');
      return;
    }
    try {
      await store.loginPin(email, pinInput);
      localStorage.setItem("friday_remembered_email", email);
    } catch (err) {
      setPinInput(''); // Clear pin on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    store.clearError?.();
    try {
      if (isLogin) {
        if (loginMethod === 'password') {
          await store.login(email, password);
          localStorage.setItem("friday_remembered_email", email);
        } else {
          await handlePinSubmit();
        }
      } else {
        await store.register(name, email, password);
        localStorage.setItem("friday_remembered_email", email);
      }
    } catch (err) {
      // Error is caught and displayed by the store
    }
  };

  const handleToggleMode = () => {
    store.clearError?.();
    setIsLogin(!isLogin);
    setName('');
    setEmail(rememberedEmail);
    setPassword('');
    setPinInput('');
    setIsSwitchedAccount(false);
  };

  const handleToggleMethod = (method) => {
    store.clearError?.();
    setLoginMethod(method);
    setPinInput('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center font-body antialiased pb-20">
      {/* Glow ambient background element */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border-[0.5px] border-outline-variant/30 rounded-xl p-8 mx-4 shadow-premium relative text-left"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-primary font-headline tracking-widest uppercase mb-1">
            FinVault
          </h2>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold opacity-70">
            {isLogin ? 'Initialize System Access' : 'Register New Protocol'}
          </p>
        </div>

        {/* Error Alert */}
        {store.error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 mb-6 bg-error-container text-error rounded-xl text-xs text-center border border-error/20 font-semibold"
          >
            ⚠️ {store.error}
          </motion.div>
        )}

        {/* Login Method Selector (Segmented Control) */}
        {isLogin && (
          <div className="flex bg-background border-[0.5px] border-outline-variant/30 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => handleToggleMethod('password')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                loginMethod === 'password'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface opacity-70 hover:opacity-100'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => handleToggleMethod('pin')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                loginMethod === 'pin'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface opacity-70 hover:opacity-100'
              }`}
            >
              PocketPin
            </button>
          </div>
        )}

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <label className="text-[10px] font-semibold text-outline uppercase tracking-wider ml-1">Directive Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background"
                  placeholder="Rahul Kapoor"
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick PIN Profile Card (if remembered email exists & PIN mode selected) */}
          {showQuickPin ? (
            <div className="flex flex-col items-center bg-background/30 border border-outline-variant/20 rounded-2xl p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-lg mb-2 shadow-inner">
                {email.substring(0, 2).toUpperCase()}
              </div>
              <h4 className="text-xs font-bold text-on-surface">{email}</h4>
              <button
                type="button"
                onClick={() => {
                  setEmail('');
                  setIsSwitchedAccount(true);
                  setPinInput('');
                }}
                className="text-[9px] text-primary font-bold tracking-wider uppercase mt-1 hover:underline"
              >
                Switch Account
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-outline uppercase tracking-wider ml-1">Access Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background"
                placeholder="rahul.kapoor@finvault.com"
                required
              />
            </div>
          )}

          {/* Form Fields: Password vs PIN keypad */}
          {isLogin && loginMethod === 'pin' ? (
            <div className="flex flex-col items-center pt-2">
              <label className="text-[10px] font-semibold text-outline uppercase tracking-wider mb-2">
                Enter PocketPin
              </label>
              
              {/* Dot Indicators */}
              <div className="flex gap-4 justify-center py-2 mb-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full border transition-all duration-200 ${
                      pinInput.length > idx
                        ? 'bg-primary border-primary scale-110 shadow-[0_0_8px_rgba(26,86,245,0.4)]'
                        : 'border-outline-variant/60 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Pin Keypad Grid */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-6 w-full max-w-[200px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => handlePinKeyPress(num.toString())}
                    className="w-11 h-11 rounded-full border border-outline-variant/30 bg-background hover:bg-primary/10 active:scale-95 transition-all text-on-surface font-semibold text-sm flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  type="button"
                  onClick={() => handlePinKeyPress('0')}
                  className="w-11 h-11 rounded-full border border-outline-variant/30 bg-background hover:bg-primary/10 active:scale-95 transition-all text-on-surface font-semibold text-sm flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-outline hover:text-on-surface active:scale-95 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">backspace</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-outline uppercase tracking-wider ml-1">Passcode</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-sm bg-background font-mono placeholder:font-sans"
                placeholder={isLogin ? "••••••••" : "Min 6 characters"}
                required
              />
            </div>
          )}

          {/* Login Button (only visible for password login or registration) */}
          {(!isLogin || loginMethod === 'password') && (
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={store.isLoading}
              className={`w-full py-4 mt-6 rounded-xl text-white font-bold tracking-widest uppercase text-xs shadow-md flex justify-center items-center ${
                store.isLoading 
                  ? 'bg-outline-variant cursor-not-allowed' 
                  : 'bg-primary hover:shadow-lg transition-shadow'
              }`}
            >
              {store.isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                isLogin ? 'Initiate Login' : 'Create Access'
              )}
            </motion.button>
          )}
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={handleToggleMode}
            className="text-xs text-primary font-bold tracking-wider uppercase hover:underline"
          >
            {isLogin ? "New to FinVault? Create account" : "Already registered? Sign in"}
          </button>
        </div>

        {/* App Metadata */}
        <div className="mt-8 text-center text-[10px] font-semibold text-outline uppercase tracking-wider opacity-50">
          FinVault Premium v4.3.0
        </div>
      </motion.div>
    </div>
  );
};
