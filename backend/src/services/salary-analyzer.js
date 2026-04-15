import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Salary from "../models/Salary.js";

export class SalaryAnalyzer {
  async calculateAllocation(userId, salary) {
    const user = await User.findById(userId);
    const fixed = user?.financialProfile?.fixedExpenses || {};

    // Get average spending from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const avgSpending = await Expense.aggregate([
      {
        $match: {
          userId: user?._id,
          date: { $gte: threeMonthsAgo },
        },
      },
      {
        $group: {
          _id: "$category",
          avg: { $avg: "$amount" },
        },
      },
    ]);

    const getAvg = (cat) => {
      const found = avgSpending.find((s) => s._id === cat);
      return found ? Math.round(found.avg) : null;
    };

    const totalEMIs = (fixed.emis || []).reduce(
      (s, e) => s + e.amount,
      0
    );

    const allocation = {
      emi: totalEMIs || Math.round(salary * 0.2),
      rent: fixed.rent || Math.round(salary * 0.15),
      sip: Math.round(salary * 0.15),
      travel: getAvg("travel") || Math.round(salary * 0.05),
      bills: getAvg("bills") || Math.round(salary * 0.05),
      groceries: getAvg("groceries") || Math.round(salary * 0.08),
      entertainment: Math.round(salary * 0.05),
      savings: Math.round(salary * 0.1),
    };

    const totalAllocated = Object.values(allocation).reduce(
      (s, v) => s + v,
      0
    );
    allocation.remaining = salary - totalAllocated;

    const warnings = [];
    if (allocation.emi > salary * 0.4)
      warnings.push("⚠️ EMI exceeds 40% of salary");
    if (allocation.remaining < 0)
      warnings.push("🔴 Expenses exceed salary!");

    return { salary, allocation, warnings, totalAllocated };
  }
}