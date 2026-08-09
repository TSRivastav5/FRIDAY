import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import api from '../services/api';

export const AdminPage = () => {
  const store = useFinanceStore();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showNukeModal, setShowNukeModal] = useState(false);
  const [nukeConfirmText, setNukeConfirmText] = useState('');
  const [isNuking, setIsNuking] = useState(false);
  const [nukeResult, setNukeResult] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getAdminUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleNuke = async () => {
    setIsNuking(true);
    setNukeResult('');
    try {
      const data = await api.nukeAllUsers();
      setNukeResult(data.message || 'Database wiped.');
      setShowNukeModal(false);
      setNukeConfirmText('');
      store.logout();
    } catch (err) {
      setNukeResult(err.message || 'Failed to wipe database');
    } finally {
      setIsNuking(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-inverse-surface docked full-width top-0 rounded-b-none z-50 sticky">
        <div className="flex justify-between items-center w-full px-5 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
            </div>
            <h1 className="text-lg font-bold text-on-primary text-left">Admin Panel</h1>
          </div>
          <button
            onClick={() => store.setActiveTab('profile')}
            className="text-on-primary opacity-70 hover:opacity-100 transition-all duration-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pt-6 space-y-6 flex flex-col items-stretch">
        {/* Users Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pl-1">
            <h3 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest text-left">
              Registered Users {!isLoading && `(${users.length})`}
            </h3>
            <button
              onClick={loadUsers}
              className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="p-3 bg-error-container text-error rounded-xl text-xs text-center border border-error/20 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl overflow-hidden shadow-sm divide-y divide-outline-variant/10">
              {users.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-4 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs">
                      {(u.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{u.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-outline-variant/20 text-on-surface-variant'
                      }`}
                    >
                      {u.role || 'user'}
                    </span>
                    <span className="text-[9px] text-on-surface-variant opacity-70">
                      {u.familyRole || 'self'}
                    </span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-6 text-center text-xs text-on-surface-variant">No users found.</div>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-semibold text-error uppercase tracking-widest pl-1 text-left">Danger Zone</h3>
          <div className="bg-error/5 border-[0.5px] border-error/20 rounded-xl p-4 space-y-3">
            <p className="text-xs text-error/90 leading-relaxed font-medium">
              Wiping the database permanently deletes every user and all associated financial data across the entire app. This cannot be undone.
            </p>
            <button
              onClick={() => setShowNukeModal(true)}
              className="w-full flex items-center justify-center gap-2 p-3 text-white font-bold bg-error hover:bg-error/90 rounded-xl transition-colors active:scale-95 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Wipe Entire Database
            </button>
            {nukeResult && (
              <p className="text-[11px] text-center text-on-surface-variant font-medium">{nukeResult}</p>
            )}
          </div>
        </div>
      </main>

      {/* Nuke Confirmation Modal */}
      <AnimatePresence>
        {showNukeModal && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-premium relative text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-error font-headline">Wipe Database Permanently?</h3>
                <button
                  onClick={() => {
                    setShowNukeModal(false);
                    setNukeConfirmText('');
                  }}
                  className="text-outline hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-error/5 text-error text-xs rounded-xl border border-error/10 leading-relaxed font-semibold">
                  ⚠️ WARNING: This deletes every registered user and all their expenses, investments, salary records, and chat history. This action cannot be undone.
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-on-surface-variant font-semibold">
                    Type <strong className="text-error select-all">WIPE</strong> in the box below to confirm:
                  </p>
                  <input
                    type="text"
                    value={nukeConfirmText}
                    onChange={(e) => setNukeConfirmText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:ring-2 focus:ring-error/20 focus:border-error focus:outline-none transition-all text-sm bg-background text-center font-bold tracking-wider"
                    placeholder="WIPE"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNukeModal(false);
                      setNukeConfirmText('');
                    }}
                    className="flex-1 py-3 border border-outline-variant/40 hover:bg-background text-on-surface font-semibold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNuke}
                    disabled={nukeConfirmText !== 'WIPE' || isNuking}
                    className="flex-1 py-3 bg-error hover:bg-error/95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    {isNuking ? 'Wiping...' : 'Wipe Database'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
