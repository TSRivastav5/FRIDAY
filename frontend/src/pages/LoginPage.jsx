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
    try {
      if (isLogin) {
        await store.login(email, password);
      } else {
        await store.register(name, email, password);
      }
    } catch (err) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md p-8 glass-card rounded-3xl mx-4 dark:bg-gray-800/50 shadow-2xl overflow-hidden relative"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              textShadow: ["0px 0px 8px rgba(99,102,241,0.5)", "0px 0px 16px rgba(99,102,241,0.8)", "0px 0px 8px rgba(99,102,241,0.5)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-2 inline-block tracking-widest"
          >
            FRIDAY
          </motion.div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Initialize System Access' : 'Register New Protocol'}
          </p>
        </div>

        {store.error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm text-center border shadow-sm border-red-200 dark:border-red-800"
          >
            ⚠️ {store.error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ml-1">Directive Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all dark:text-white"
                  placeholder="Hi Boss"
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ml-1">Access Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all dark:text-white"
              placeholder="boss@stark.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ml-1">Passcode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all dark:text-white font-mono placeholder:font-sans"
              placeholder={isLogin ? "••••••••" : "Min 6 characters"}
              required
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={store.isLoading}
            className={`w-full py-4 mt-4 rounded-xl text-white font-bold tracking-wide uppercase text-sm shadow-premium flex justify-center items-center ${
              store.isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg'
            }`}
          >
            {store.isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isLogin ? 'Initiate Login' : 'Create Access'
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Access restricted. New protocols must be initiated internally.
        </div>
      </motion.div>
    </div>
  );
};
