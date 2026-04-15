import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import Expense from "../../models/Expense.js";

export const createExpenseTrackerTool = (userId) => {
  return new DynamicStructuredTool({
    name: "expense_tracker",
    description: `Track and analyze user expenses. Can add new expenses, 
      get monthly summaries, identify spending patterns, and find areas to save.`,
    schema: z.object({
      action: z.enum(["add", "summary", "analyze", "category_breakdown"]),
      category: z.string().optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
      month: z.string().optional().describe("Month in YYYY-MM format"),
    }),
    func: async ({ action, category, amount, description, month }) => {
      try {
        switch (action) {
          case "add":
            if (!category || !amount) return JSON.stringify({ error: "Missing category or amount for add action" });
            const expense = await Expense.create({
              userId, category, amount, description, date: new Date(),
            });
            return JSON.stringify({ success: true, expense });

          case "summary":
            const targetMonth = month || new Date().toISOString().slice(0, 7);
            const expenses = await Expense.find({
              userId,
              date: {
                $gte: new Date(`${targetMonth}-01`),
                $lt: new Date(`${targetMonth}-31`),
              },
            });
            const total = expenses.reduce((sum, e) => sum + e.amount, 0);
            const byCategory = expenses.reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            }, {});
            return JSON.stringify({ total, byCategory, count: expenses.length });

          case "category_breakdown":
            const allExpenses = await Expense.find({ userId }).sort({ date: -1 }).limit(100);
            const breakdown = allExpenses.reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            }, {});
            return JSON.stringify(breakdown);

          default:
            return JSON.stringify({ error: "Action not supported or missing data" });
        }
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
  });
};
