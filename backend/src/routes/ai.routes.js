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
    // Guard: catch missing API key before making the Groq call
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GROQ_API_KEY is not set on the server",
        fix: "Add GROQ_API_KEY to your Render → Environment → Environment Variables",
      });
    }

    const { message, messages, userData } = req.body;

    // 1. If request comes in the custom "messages" format (from direct fetch prompt)
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",   // free, fast, smart
          max_tokens: 1024,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(userData || {})
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Groq error:", response.status, data);
        return res.status(response.status).json({
          error: data?.error?.message || `Groq error ${response.status}`,
          code: response.status
        });
      }

      const text = data?.choices?.[0]?.message?.content;

      if (!text) {
        return res.status(500).json({ error: "Empty response from Groq" });
      }

      // Save to chat history if user is authenticated
      if (req.user && req.user.id) {
        const today = new Date().toISOString().slice(0, 10);
        const lastUserMsg = messages[messages.length - 1]?.content || "Hello";
        await ChatHistory.findOneAndUpdate(
          { userId: req.user.id, sessionDate: today },
          {
            $push: {
              messages: [
                { role: "user", content: lastUserMsg },
                { role: "assistant", content: text },
              ],
            },
          },
          { upsert: true }
        );
      }

      return res.json({
        success: true,
        reply: text,
        message: text,
        response: text
      });
    }

    // 2. Default: standard app chat format using the agent
    if (!message) {
      return res.status(400).json({ error: "Message or messages array is required" });
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

    res.json({
      ...response,
      reply: response.message,
      response: response.message
    });
  } catch (error) {
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
// ── System prompt ─────────────────────────────────────────────
function buildSystemPrompt(userData) {
  const {
    name = "there",
    salary = 0,
    emiTotal = 0,
    emis = [],
    rent = 0,
    sipTotal = 0,
    sips = [],
    travelBudget = 0,
    billsBudget = 0,
    surplus = 0,
    lastSalaryMonth = "this month",
  } = userData;

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const emiList = emis.length
    ? emis.map(e => `  - ${e.label}: ₹${fmt(e.amount)}`).join("\n")
    : "  - No EMIs configured yet";

  const sipList = sips.length
    ? sips.map(s => `  - ${s.fundName}: ₹${fmt(s.amount)}/month`).join("\n")
    : "  - No SIPs configured yet";

  return `You are FRIDAY — Financial Resource & Investment Decision AI for You.
You are a smart personal finance assistant for \${name}.

## \${name}'s financial profile:
- Monthly salary: ₹\${fmt(salary)} (\${lastSalaryMonth})
- Available balance after all commitments: ₹\${fmt(surplus)}
- Total EMI: ₹\${fmt(emiTotal)}
\${emiList}
- Rent: ₹\${fmt(rent)}
- Total SIP: ₹\${fmt(sipTotal)}
\${sipList}
- Travel budget: ₹\${fmt(travelBudget)}
- Bills & utilities: ₹\${fmt(billsBudget)}

## How you behave:
- Direct and human. No jargon. No corporate speak.
- Always use Indian Rupee ₹ and Indian number format (lakhs, crores).
- Show the math clearly when answering money questions.
- Give ONE clear recommendation, not a vague list.
- Short responses — this is a mobile app.
- Never say you lack access to data — all data is provided above.
- Never say "consult a financial advisor" for general questions.
- Call the user by name: \${name}. Never say "Boss".
- Plain text only. No markdown symbols like * or #.`;
}

export default router;