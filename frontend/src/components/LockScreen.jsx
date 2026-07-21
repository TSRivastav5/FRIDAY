import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';

export const LockScreen = () => {
  const store = useFinanceStore();
  const userName = store.user?.name || "Rahul";
  const userEmail = store.user?.email;

  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  const handleKeyPress = (num) => {
    if (pinInput.length >= 4 || isVerifying) return;
    const newVal = pinInput + num;
    setPinInput(newVal);

    if (newVal.length === 4) {
      verifyPin(newVal);
    }
  };

  const verifyPin = async (pin) => {
    setIsVerifying(true);
    setError('');
    try {
      await store.loginPin(userEmail, pin);
      // store.loginPin sets isLocked: false on success
    } catch (err) {
      setError(err.message || 'Incorrect PIN');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPinInput('');
        setIsVerifying(false);
      }, 500);
      return;
    }
    setIsVerifying(false);
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleSwitchAccount = () => {
    store.logout();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0d1326] text-white flex flex-col justify-between items-center px-6 pt-20 pb-12 overflow-hidden selection:bg-transparent">
      {/* Decorative Atmospheric Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-tertiary/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex flex-col items-center gap-4 z-10">
        <div className="w-18 h-18 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center p-0.5 shadow-xl backdrop-blur-md">
          <div className="w-full h-full rounded-[22px] bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-extrabold text-3xl shadow-inner">
            {userName.substring(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold font-headline tracking-wide">Welcome Back, Boss</h2>
          <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
            Enter 4-Digit Security PIN
          </p>
          {error && (
            <p className="text-[10px] text-error font-semibold uppercase tracking-wider">{error}</p>
          )}
        </div>
      </div>

      {/* Auth Interface */}
      <div className="w-full max-w-xs flex flex-col items-center justify-center z-10 flex-grow py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="pin-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full flex flex-col items-center gap-8"
          >
            {/* Dot Indicators */}
            <div
              className={`flex gap-4 py-2 ${
                shake ? 'animate-shake' : ''
              }`}
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                    pinInput.length > idx
                      ? 'bg-primary border-primary scale-110 shadow-[0_0_10px_rgba(26,86,245,0.4)]'
                      : 'border-white/20 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Pin Keypad Grid */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-8 w-full max-w-[240px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  disabled={isVerifying}
                  className="w-14 h-14 rounded-full border border-white/5 bg-white/5 active:bg-primary/20 hover:border-white/10 flex items-center justify-center font-semibold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <div />
              {/* 0 */}
              <button
                onClick={() => handleKeyPress('0')}
                disabled={isVerifying}
                className="w-14 h-14 rounded-full border border-white/5 bg-white/5 active:bg-primary/20 hover:border-white/10 flex items-center justify-center font-semibold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                0
              </button>
              {/* Backspace */}
              <button
                onClick={handleBackspace}
                disabled={isVerifying}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white/50 active:text-white transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">backspace</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Switch Account Action */}
      <div className="z-10 text-center">
        <button
          onClick={handleSwitchAccount}
          className="text-xs text-white/40 hover:text-white/60 font-semibold uppercase tracking-widest hover:underline active:scale-95 transition-all"
        >
          Switch Account
        </button>
      </div>

      {/* Shake CSS Styling Injection */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }
      `}</style>
    </div>
  );
};
