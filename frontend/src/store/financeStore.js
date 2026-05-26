// ============================================================
// 🏪 FRIDAY Finance Store (Updated for Backend)
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import fridayAPI from "../services/api.js";

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      // ──────── Auth State ────────
      user: fridayAPI.getUser(),
      isAuthenticated: fridayAPI.isLoggedIn(),
      
      // ──────── UI State ────────
      activeTab: "home",
      isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
      isLoading: false,
      error: null,
      showSalaryModal: false,
      setSalaryModal: (isOpen) => set({ showSalaryModal: isOpen }),
      
      // ──────── Security State ────────
      // Only lock if user is logged in AND has set a PIN
      isLocked: fridayAPI.isLoggedIn() && !!localStorage.getItem("friday_pin"),
      pin: localStorage.getItem("friday_pin") || null,
      setPin: async (newPin) => {
        localStorage.setItem("friday_pin", newPin);
        set({ pin: newPin });
        if (fridayAPI.isLoggedIn()) {
          try {
            await fridayAPI.updatePin(newPin);
          } catch (error) {
            console.error("Failed to sync PIN to backend:", error);
          }
        }
      },
      setLocked: (locked) => set({ isLocked: locked }),

      // ──────── Financial Data ────────
      salary: null,
      salaryHistory: [],
      expenses: [],
      investments: [],
      portfolioStats: null,
      
      // ──────── Chat State ────────
      chatMessages: [],
      isChatOpen: false,
      isChatLoading: false,
      aiInsight: null,
      aiError: null,                           // real error string visible in chat UI
      preloadedAiMessage: null,
      setPreloadedAiMessage: (msg) => set({ preloadedAiMessage: msg }),

      // ──────── Allocation ────────
      currentAllocation: null,
      
      // ──────── Actions ────────
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fridayAPI.login(email, password);
          // Wipe any stale financial data from a previous session before loading new user
          set({
            user: data.user,
            isAuthenticated: true,
            isLocked: false,
            isLoading: false,
            salary: null,
            salaryHistory: [],
            expenses: [],
            investments: [],
            portfolioStats: null,
            currentAllocation: null,
            chatMessages: [],
          });
          // Fetch new user's financial telemetry data
          await get().fetchCurrentSalary();
          await get().fetchInvestments();
          await get().fetchExpenses();
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loginPin: async (email, pin) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fridayAPI.loginPin(email, pin);
          // Wipe any stale financial data from a previous session before loading new user
          set({
            user: data.user,
            isAuthenticated: true,
            isLocked: false,
            isLoading: false,
            salary: null,
            salaryHistory: [],
            expenses: [],
            investments: [],
            portfolioStats: null,
            currentAllocation: null,
            chatMessages: [],
            pin: pin, // Set pin state on success
          });
          // Also set it in localStorage so returning users don't have to enter it again for the lockscreen
          localStorage.setItem("friday_pin", pin);
          // Fetch new user's financial telemetry data
          await get().fetchCurrentSalary();
          await get().fetchInvestments();
          await get().fetchExpenses();
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fridayAPI.register(name, email, password);
          // Fresh slate for a new user
          set({
            user: data.user,
            isAuthenticated: true,
            isLocked: false,
            isLoading: false,
            salary: null,
            salaryHistory: [],
            expenses: [],
            investments: [],
            portfolioStats: null,
            currentAllocation: null,
            chatMessages: [],
          });
          // Fetch new user's financial telemetry data
          await get().fetchCurrentSalary();
          await get().fetchInvestments();
          await get().fetchExpenses();
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateAllocation: async (allocation) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const id = state.salary?._id;
          
          if (id) {
            await fridayAPI.updateAllocation(id, allocation);
          }

          // Sync rules to user's financialProfile so they are persisted on the server
          const updatedProfile = {
            ...state.user?.financialProfile,
            monthlySalary: allocation.salary || state.user?.financialProfile?.monthlySalary || 0,
            fixedExpenses: {
              ...state.user?.financialProfile?.fixedExpenses,
              rent: allocation.rent,
              emiDefault: allocation.emi,
            },
            sipDefault: allocation.sip,
            travelDefault: allocation.travel,
            billsDefault: allocation.bills,
          };

          const profileData = await fridayAPI.updateProfile(updatedProfile);
          
          set({
            currentAllocation: allocation,
            user: profileData.user,
            isLoading: false,
          });

          localStorage.setItem("friday_user", JSON.stringify(profileData.user));
          return profileData;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateSalaryAllocation: async (salaryId, allocation, paidAllocations) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fridayAPI.updateAllocation(salaryId, allocation, paidAllocations);
          if (res.success && res.salary) {
            // Update local salary state if it's the current active salary
            const currentSalary = get().salary;
            if (currentSalary && currentSalary._id === salaryId) {
              set({ 
                salary: res.salary,
                currentAllocation: res.salary.allocation 
              });
            }
            
            // Also update the record in the salaryHistory list
            const updatedHistory = get().salaryHistory.map(s => 
              s._id === salaryId ? res.salary : s
            );
            set({ salaryHistory: updatedHistory, isLocked: false }); // Reset lock if applicable, keep history updated
            set({ salaryHistory: updatedHistory, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateProfile: async (updatedProfile) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fridayAPI.updateProfile(updatedProfile);
          set({ user: data.user, isLoading: false });
          localStorage.setItem("friday_user", JSON.stringify(data.user));
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteSalary: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await fridayAPI.deleteSalary(id);
          // If we deleted the current active salary, clear active salary and currentAllocation
          const currentSalary = get().salary;
          if (currentSalary && currentSalary._id === id) {
            set({ salary: null, currentAllocation: null });
          }
          // Remove from salary history
          const updatedHistory = get().salaryHistory.filter(s => s._id !== id);
          set({ salaryHistory: updatedHistory, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      resetAllocation: async () => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const id = state.salary?._id;
          const emptyAllocation = { emi: 0, rent: 0, travel: 0, sip: 0, bills: 0, remaining: 0 };
          
          if (id) {
            await fridayAPI.updateAllocation(id, emptyAllocation);
          }
          
          set({
            currentAllocation: emptyAllocation,
            salary: null,
            isLoading: false
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        fridayAPI.logout();
        // Full state wipe — no data should survive across user sessions
        set({
          user: null,
          isAuthenticated: false,
          isLocked: false,
          salary: null,
          salaryHistory: [],
          expenses: [],
          investments: [],
          portfolioStats: null,
          currentAllocation: null,
          chatMessages: [],
          error: null,
          isLoading: false,
        });
      },

      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          await fridayAPI.deleteAccount();
          fridayAPI.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLocked: false,
            salary: null,
            salaryHistory: [],
            expenses: [],
            investments: [],
            portfolioStats: null,
            currentAllocation: null,
            chatMessages: [],
            error: null,
            isLoading: false,
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Salary
      creditSalary: async (amount) => {
        set({ isLoading: true });
        try {
          const data = await fridayAPI.creditSalary(amount);
          set({ 
            salary: data.salary,
            currentAllocation: data.salary.allocation,
            isLoading: false,
          });
          // Add FRIDAY's response to chat
          get().addChatMessage("assistant", data.fridayResponse);
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      fetchCurrentSalary: async () => {
        set({ isLoading: true });
        try {
          const data = await fridayAPI.getCurrentSalary();
          if (data.salary) {
            set({ 
              salary: data.salary,
              currentAllocation: data.salary.allocation,
              isLoading: false 
            });
          } else {
            set({ 
              salary: null,
              currentAllocation: null,
              isLoading: false 
            });
          }
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchSalaryHistory: async () => {
        try {
          const data = await fridayAPI.getSalaryHistory();
          // API returns { salaries: [...] }
          set({ salaryHistory: data.salaries || [] });
        } catch (error) {
          console.error("Failed to fetch salary history:", error);
        }
      },

      // Expenses
      fetchExpenses: async (params) => {
        try {
          const data = await fridayAPI.getExpenses(params);
          set({ expenses: data.expenses });
          return data;
        } catch (error) {
          console.error("Failed to fetch expenses:", error);
        }
      },

      addExpense: async (expense) => {
        try {
          const data = await fridayAPI.addExpense(expense);
          set(state => ({ expenses: [data.expense, ...state.expenses] }));
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      deleteExpense: async (id) => {
        try {
          await fridayAPI.deleteExpense(id);
          set(state => ({ 
            expenses: state.expenses.filter(e => e._id !== id) 
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Investments
      fetchInvestments: async () => {
        try {
          const data = await fridayAPI.getInvestments();
          set({ investments: data.investments, portfolioStats: data.stats });
          return data;
        } catch (error) {
          console.error("Failed to fetch investments:", error);
        }
      },

      addInvestment: async (investment) => {
        try {
          const data = await fridayAPI.addInvestment(investment);
          set(state => ({ investments: [data.investment, ...state.investments] }));
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      clearAllInvestments: async () => {
        set({ isLoading: true, error: null });
        try {
          await fridayAPI.clearAllInvestments();
          set({ 
            investments: [], 
            portfolioStats: { totalInvested: 0, currentValue: 0, totalGain: 0, gainPercent: 0 },
            isLoading: false 
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteInvestment: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await fridayAPI.deleteInvestment(id);
          set(state => ({
            investments: state.investments.filter(i => i._id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      syncGrowwPortfolio: async () => {
        set({ isLoading: true, error: null });
        try {
          await fridayAPI.syncGrowwPortfolio();
          await get().fetchInvestments();
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // AI Chat
      chatWithFriday: async (message) => {
        set({ isChatLoading: true, aiError: null });
        get().addChatMessage("user", message);

        try {
          const data = await fridayAPI.chatWithFriday(message);
          const aiResponse = data.message || data.response || "Sorry, I couldn't generate a response.";
          get().addChatMessage("assistant", aiResponse);
          set({ isChatLoading: false });
          return data;
        } catch (error) {
          // Surface the REAL error — never replace it with a fake friendly message
          const errMsg = error.message || "Unknown error from server";
          console.error("Chat error:", errMsg);
          set({ isChatLoading: false, aiError: errMsg });
          // Also push it as a visible assistant message so it shows in the chat thread
          get().addChatMessage(
            "assistant",
            `❌ Error: ${errMsg}\n\nCheck Render logs and make sure GROQ_API_KEY is set in your Render environment variables.`
          );
          throw error;
        }
      },

      fetchChatHistory: async () => {
        set({ isChatLoading: true });
        try {
          const data = await fridayAPI.getChatHistory();
          if (data.success && data.history) {
            // Sort history sessions chronologically (oldest session first)
            const sortedHistory = [...data.history].reverse();
            // Flatten all messages from the sessions
            const flattened = sortedHistory.reduce((acc, session) => {
              const msgs = (session.messages || []).map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp || session.createdAt
              }));
              return acc.concat(msgs);
            }, []);
            set({ chatMessages: flattened, isChatLoading: false });
          } else {
            set({ isChatLoading: false });
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
          set({ isChatLoading: false });
        }
      },

      fetchTelemetryInsight: async () => {
        try {
          const data = await fridayAPI.getTelemetryInsight();
          if (data.success) {
            set({ aiInsight: data.insight });
          }
        } catch (error) {
          console.error("Failed to fetch telemetry insight:", error);
        }
      },

      addChatMessage: (role, content) => {
        set(state => ({
          chatMessages: [
            ...state.chatMessages,
            { role, content, timestamp: new Date().toISOString() },
          ],
        }));
      },

      // UI
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),
      toggleChat: () => set(state => ({ isChatOpen: !state.isChatOpen })),
      clearError: () => set({ error: null }),
    }),
    {
      name: "friday-store",
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        activeTab: state.activeTab,
      }),
    }
  )
);