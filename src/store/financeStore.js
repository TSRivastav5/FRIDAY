import { create } from 'zustand';
import { mockExpenses, mockInvestments, mockSalaryHistory } from '../data/mockData';

export const useFinanceStore = create((set) => ({
  // User data
  userName: 'Trishant',
  totalBalance: 42500,
  monthlySalary: 50000,
  
  // Dashboard
  expenses: mockExpenses,
  investments: mockInvestments,
  salaryHistory: mockSalaryHistory,
  
  // Current salary allocation
  currentAllocation: {
    salary: 50000,
    emi: 15000,
    rent: 10000,
    travel: 3000,
    sip: 10000,
    savings: 5000,
    remaining: 7000,
  },

  // Chat messages
  chatMessages: [],

  // UI state
  isDarkMode: false,
  showSalaryModal: false,
  showChatWidget: false,
  activeTab: 'home',
  showExportModal: false,

  // Actions
  addExpense: (expense) => 
    set((state) => ({
      ...state,
      expenses: [...state.expenses, expense],
      totalBalance: state.totalBalance - expense.amount,
    })),

  deleteExpense: (id) =>
    set((state) => {
      const expense = state.expenses.find((e) => e.id === id);
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== id),
        totalBalance: state.totalBalance + (expense?.amount || 0),
      };
    }),

  addInvestment: (investment) =>
    set((state) => ({
      ...state,
      investments: [...state.investments, investment],
    })),

  updateAllocation: (allocation) =>
    set((state) => ({
      ...state,
      currentAllocation: allocation,
      totalBalance: state.totalBalance - (allocation.salary - state.currentAllocation.salary),
    })),

  addChatMessage: (message) =>
    set((state) => ({
      ...state,
      chatMessages: [...state.chatMessages, message],
    })),

  clearChatMessages: () => set({ chatMessages: [] }),

  setSalaryModal: (show) => set({ showSalaryModal: show }),
  setChatWidget: (show) => set({ showChatWidget: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setExportModal: (show) => set({ showExportModal: show }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Computed values
  getMonthlyExpenses: (state) => {
    const now = new Date();
    return state.expenses.filter((e) => {
      const expDate = new Date(e.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
  },

  getTotalMonthlyExpense: (state) => {
    const monthlyExpenses = state.getMonthlyExpenses(state);
    return monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  },

  getExpensesByCategory: (state) => {
    const monthlyExpenses = state.getMonthlyExpenses(state);
    const grouped = {};
    monthlyExpenses.forEach((e) => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return grouped;
  },

  getInvestmentStats: (state) => {
    const totalInvested = state.investments.reduce((sum, i) => sum + i.amount, 0);
    const totalValue = state.investments.reduce((sum, i) => sum + i.currentValue, 0);
    const gain = totalValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
    return { totalInvested, totalValue, gain, gainPercent };
  },
}));
