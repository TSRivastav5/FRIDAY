import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Expense from "../models/Expense.js";
import { sendPushToUser } from "../services/push.service.js";

const router = Router();
router.use(auth);

// Get expenses
router.get("/", async (req, res) => {
  try {
    const { month, category, limit = 50, page = 1 } = req.query;
    const filter = { userId: req.user.id };

    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      filter.date = { $gte: start, $lt: end };
    }
    if (category) filter.category = category;

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(filter);

    res.json({ success: true, expenses, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  // Add expense
router.post("/", async (req, res) => {
  try {
    const expense = await Expense.create({
      userId: req.user.id,
      ...req.body,
    });

    // 🔔 Fire real push notification
    const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
    const cat = expense.category || "General";
    await sendPushToUser(req.user.id, {
      title: `💸 Spend Logged — ${cat}`,
      body: `${fmt(expense.amount)} tracked under ${cat}. Check your surplus on FRIDAY.`,
      icon: "/logo.svg",
      tag: `expense-${expense._id}`,
      url: "/expenses",
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly summary
router.get("/summary", async (req, res) => {
  try {
    const month =
      req.query.month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const summary = await Expense.aggregate([
      {
        $match: {
          userId: req.user.id,
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, summary, month });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;