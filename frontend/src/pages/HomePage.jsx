import React from 'react';
import { motion } from 'framer-motion';
import { BalanceCard } from '../components/BalanceCard';
import { DashboardCard } from '../components/DashboardCard';
import { SalaryModal } from '../components/SalaryModal';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';

export const HomePage = () => {
  const store = useFinanceStore();
  const userName = store.user?.name || "Boss";
  const totalBalance = store.salary?.amount || 0;
  const monthlySalary = store.salary?.amount || 0;
  const monthlyExpense = store.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const investStats = store.portfolioStats || { totalValue: 0, gainPercent: 0 };
  const currentAllocation = store.currentAllocation || { emi: 0, rent: 0, savings: 0 };
  const showSalaryModal = store.showSalaryModal || false;

  return (
    <div className="pb-32 pt-2">
      {/* Balance Card */}
      <BalanceCard
        userName={userName}
        balance={totalBalance}
        monthlySalary={monthlySalary}
      />

      {/* Quick Actions */}
      <div className="px-4 space-y-4 mb-8">
        <motion.button
          onClick={() => store.setSalaryModal(true)}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-lg shadow-premium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          💰 Salary Credited
        </motion.button>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <DashboardCard
            icon="📊"
            title="Expenses"
            value={formatCurrency(monthlyExpense)}
            subtitle="This month"
            color="blue"
          />
          <DashboardCard
            icon="📈"
            title="Investments"
            value={formatCurrency(investStats.totalValue)}
            subtitle={`+${investStats.gainPercent.toFixed(1)}%`}
            color="green"
          />
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <DashboardCard
            icon="💳"
            title="Bills & EMI"
            value={formatCurrency(currentAllocation.emi + currentAllocation.rent)}
            subtitle="Monthly"
            color="orange"
          />
          <DashboardCard
            icon="🏦"
            title="Savings"
            value={formatCurrency(currentAllocation.savings)}
            subtitle="Reserved"
            color="purple"
          />
        </div>
      </div>

      {/* Recent Insights */}
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">💡 FRIDAY Insights</h2>
        <div className="space-y-3">
          {[
            { icon: '📊', title: 'Spending Alert', desc: 'You spent 25% more on food this month' },
            { icon: '📈', title: 'Investment Gain', desc: 'Your SIP gained 4.2% this quarter' },
            { icon: '💡', title: 'Opportunity', desc: 'You can increase SIP by ₹2,000' },
          ].map((insight, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <p className="font-semibold text-sm">{insight.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{insight.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Salary Modal */}
      <SalaryModal
        isOpen={showSalaryModal}
        onClose={() => store.setSalaryModal?.(false)}
        onSubmit={store.updateAllocation}
        currentAllocation={currentAllocation}
      />
    </div>
  );
};
