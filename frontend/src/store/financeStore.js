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
      isAuthenticated: fridayAPI.isAuthenticated(),
      
      // ──────── UI State ────────
      activeTab: "home",
      isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
      isLoading: false,
      error: null,

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

      // ──────── Allocation ────────
      currentAllocation: null,
      
      // ──────── Actions ────────
      
      // Auth
      login: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fridayAPI.login(email);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      register: async (name, email) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fridayAPI.register(name, email);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        fridayAPI.logout();
        set({ user: null, isAuthenticated: false });
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

      fetchSalaryHistory: async () => {
        try {
          const data = await fridayAPI.getSalaryHistory();
          set({ salaryHistory: data.history });
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

      // AI Chat
      chatWithFriday: async (message) => {
        set({ isChatLoading: true });
        get().addChatMessage("user", message);
        
        try {
          const data = await fridayAPI.chatWithFriday(message);
          get().addChatMessage("assistant", data.response);
          set({ isChatLoading: false });
          return data;
        } catch (error) {
          get().addChatMessage("assistant", "Sorry boss, I encountered an issue. Please try again.");
          set({ isChatLoading: false });
          throw error;
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