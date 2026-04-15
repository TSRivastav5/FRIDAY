import FridayAgent from "../agents/friday-master.js";
import ChatHistory from "../models/ChatHistory.js";
import Salary from "../models/Salary.js";
import User from "../models/User.js";

// Store agent instances per user (for memory persistence)
const agentInstances = new Map();

// Get or create agent instance for user
async function getAgent(userId) {
  if (!agentInstances.has(userId)) {
    const agent = new FridayAgent(userId);
    await agent.initialize();
    agentInstances.set(userId, agent);
  }
  return agentInstances.get(userId);
}

// ──────────────────────────────────────────
// 💬 Chat with FRIDAY
// ──────────────────────────────────────────
export const chatWithFriday = async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const agent = await getAgent(userId);
    const response = await agent.chat(message, context || {});

    // Save to chat history
    await ChatHistory.findOneAndUpdate(
      { userId, isActive: true },
      {
        $push: {
          messages: [
            { role: "user", content: message },
            { 
              role: "assistant", 
              content: response.message,
              actions: response.actions,
            },
          ],
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      response: response.message,
      actions: response.actions,
      timestamp: response.timestamp,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      success: false,
      error: "FRIDAY encountered an issue",
      message: error.message,
    });
  }
};

// ──────────────────────────────────────────
// 💰 Handle Salary Credited
// ──────────────────────────────────────────
export const handleSalaryCredited = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid salary amount is required" });
    }

    const agent = await getAgent(userId);
    
    // Get the full AI analysis
    const analysis = await agent.handleSalaryCredited(amount);

    // Save salary record
    const salary = await Salary.create({
      userId,
      amount,
      month: new Date().toISOString().slice(0, 7),
      creditDate: new Date(),
      aiAnalysis: {
        summary: analysis.message,
        recommendations: analysis.actions
          .filter(a => a.tool === "investment_advisor")
          .map(a => JSON.parse(a.result)),
      },
    });

    // Update user's monthly salary
    await User.findByIdAndUpdate(userId, {
      "financialProfile.monthlySalary": amount,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      salary: salary,
      fridayResponse: analysis.message,
      actions: analysis.actions,
      greeting: `Welcome back, Boss! 💰 ₹${amount.toLocaleString('en-IN')} has been noted.`,
    });
  } catch (error) {
    console.error("Salary credit error:", error);
    res.status(500).json({ error: "Failed to process salary", message: error.message });
  }
};

// ──────────────────────────────────────────
// 📈 Get Investment Advice
// ──────────────────────────────────────────
export const getInvestmentAdvice = async (req, res) => {
  try {
    const { budget, riskProfile, goal } = req.body;
    const userId = req.user.id;

    const agent = await getAgent(userId);
    const advice = await agent.getInvestmentAdvice(budget);

    res.json({
      success: true,
      advice: advice.message,
      actions: advice.actions,
    });
  } catch (error) {
    console.error("Investment advice error:", error);
    res.status(500).json({ error: "Failed to get advice", message: error.message });
  }
};

// ──────────────────────────────────────────
// 📊 Get Spending Analysis
// ──────────────────────────────────────────
export const getSpendingAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const agent = await getAgent(userId);

    const analysis = await agent.chat(
      "Analyze my spending patterns for the last 3 months. " +
      "Identify areas where I'm overspending and suggest ways to save. " +
      "Use the expense_tracker tool with 'analyze' action."
    );

    res.json({
      success: true,
      analysis: analysis.message,
      actions: analysis.actions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze spending", message: error.message });
  }
};

// ──────────────────────────────────────────
// 🔍 Portfolio Review
// ──────────────────────────────────────────
export const getPortfolioReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const agent = await getAgent(userId);

    const review = await agent.chat(
      "Give me a complete portfolio review. " +
      "Check all my investments, identify underperformers, " +
      "and tell me which stocks I should sell and which I should buy more of. " +
      "Use portfolio_analysis with 'full_analysis' type."
    );

    res.json({
      success: true,
      review: review.message,
      actions: review.actions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to review portfolio", message: error.message });
  }
};