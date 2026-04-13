import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenseCategories, generateId } from '../data/mockData';
import { formatCurrency, formatDateShort } from '../utils/helpers';

export const ExpenseList = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
    description: '',
  });

  const handleAddExpense = () => {
    if (formData.amount) {
      onAddExpense({
        id: generateId(),
        ...formData,
        amount: parseInt(formData.amount),
        date: new Date().toISOString().split('T')[0],
      });
      setFormData({ category: 'Food', amount: '', description: '' });
      setShowForm(false);
    }
  };

  const categoryEmojis = {
    Food: '🍔',
    Travel: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎬',
    Bills: '📱',
    Health: '🏥',
    Education: '📚',
    Other: '📌',
  };

  return (
    <div className="space-y-4">
      {/* Add Expense Button */}
      <motion.button
        onClick={() => setShowForm(!showForm)}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-premium"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-xl">+</span> Add Expense
      </motion.button>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 btn-primary text-sm"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense List */}
      <div className="space-y-2">
        {expenses.slice().reverse().map((expense) => (
          <motion.div
            key={expense.id}
            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{categoryEmojis[expense.category] || '📌'}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{expense.category}</div>
                <div className="text-xs text-gray-500">{expense.description || formatDateShort(expense.date)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-indigo-500">-{formatCurrency(expense.amount)}</div>
            </div>
            <motion.button
              onClick={() => onDeleteExpense(expense.id)}
              className="ml-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
              whileHover={{ scale: 1.1 }}
            >
              ✕
            </motion.button>
          </motion.div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-3xl mb-2">👻</p>
          <p>No expenses yet. Add your first one!</p>
        </div>
      )}
    </div>
  );
};
