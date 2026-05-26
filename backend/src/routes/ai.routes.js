import { Router } from "express";
import { auth } from "../middleware/auth.js";
import FridayAgent from "../services/friday-agent.js";
import Salary from "../models/Salary.js";
import User from "../models/User.js";
import ChatHistory from "../models/ChatHistory.js";
import { sendPushToUser } from "../services/push.service.js";

const router = Router();
router.use(auth);

const agent = new FridayAgent();

// 💬 Chat with FRIDAY
router.post("/chat", async (req, res) => {
  try {
    // Guard: catch missing API key before making the Gemini call
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not set on the server",
        fix: "Add GEMINI_API_KEY to your Render → Environment → Environment Variables",
      });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await agent.chat(req.user.id, message);

    // Save to chat history
    const today = new Date().toISOString().slice(0, 10);
    await ChatHistory.findOneAndUpdate(
      { userId: req.user.id, sessionDate: today },
      {
        $push: {
          messages: [
            {
              role: "user",
              content: message,
            },
            {
              role: "assistant",
              content: response.message,
            },
          ],
        },
      },
      { upsert: true }
    );

    res.json(response);
  } catch (error) {
    // Return the REAL error — never a fake friendly message
    console.error("AI chat route error:", error.message, error?.status);
    return res.status(500).json({
      success: false,
      error: error.message || "Unexpected server error",
      code: error.status || 500,
      detail: error.errorDetails || null,
      hint: "Check Render logs for the full stack trace",
    });
  }
});

// 💰 Salary Credited — Main Flow
router.post("/salary-credited", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Valid salary amount required" });
    }

    // Get AI analysis
    const analysis = await agent.handleSalaryCredited(
      req.user.id,
      amount
    );

    // Save salary record
    const salary = await Salary.create({
      userId: req.user.id,
      amount,
      month: new Date().toISOString().slice(0, 7),
      allocation: analysis.aiAllocation || analysis.defaultAllocation,
      aiAnalysis: {
        greeting: analysis.greeting,
        insights: analysis.insights,
        investmentSuggestions:
          analysis.investmentAdvice?.suggestions || [],
        warnings: analysis.warnings,
        actionItems: analysis.actionItems,
      },
    });

    // Update user's salary
    await User.findByIdAndUpdate(req.user.id, {
      "financialProfile.monthlySalary": amount,
    });

    // 🔔 Fire real push notification
    const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
    await sendPushToUser(req.user.id, {
      title: "💰 Salary Protocol Active",
      body: `${fmt(amount)} credited. FRIDAY is auto-allocating your commitments.`,
      icon: "/logo.svg",
      tag: "salary-credited",
      url: "/",
    });

    res.json({
      success: true,
      salary,
      ...analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 📈 Investment Advice
router.post("/investment-advice", async (req, res) => {
  try {
    const { budget } = req.body;
    const advice = await agent.getInvestmentAdvice(req.user.id, budget);
    res.json(advice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 Spending Analysis
router.get("/spending-analysis", async (req, res) => {
  try {
    const analysis = await agent.getSpendingAnalysis(req.user.id);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Portfolio Review
router.get("/portfolio-review", async (req, res) => {
  try {
    const review = await agent.getPortfolioReview(req.user.id);
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 💡 Telemetry Insight
router.get("/telemetry-insight", async (req, res) => {
  try {
    const insight = await agent.getTelemetryInsight(req.user.id);
    res.json(insight);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📜 Chat History
router.get("/chat-history", async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;