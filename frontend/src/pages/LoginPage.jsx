import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';

export const LoginPage = () => {
  const store = useFinanceStore();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    store.clearError?.();
    try {
      if (isLogin) {
        await store.login(email, password);
      } else {
        await store.register(name, email, password);
      }
    } catch (err) {
      // Error is caught and displayed by the store
    }
  };

  const handleToggleMode = () => {
    store.clearError?.();
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
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
        <div className="text-center mb-8">
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
          FinVault Premium v4.2.0
        </div>
      </motion.div>
    </div>
  );
};
