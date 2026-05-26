// ============================================================
// 🤖 FRIDAY AGENT — The AI Brain (Powered by FREE Gemini)
// ============================================================
// This is the heart of FRIDAY. It uses Google Gemini (free)
// to think, reason, and give financial advice.
// ============================================================

import genAI, { geminiModel, geminiProModel } from "../config/gemini.js";
import { SalaryAnalyzer } from "./salary-analyzer.js";
import { InvestmentAdvisor } from "./investment-advisor.js";
import { StockService } from "./stock-service.js";
import { MutualFundService } from "./mutualfund-service.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Investment from "../models/Investment.js";
import Salary from "../models/Salary.js";

// ──────────────────────────────────────────────────
// 🛠️ GEMINI TOOL DECLARATIONS
// ──────────────────────────────────────────────────
const getLiveMarketQuoteDeclaration = {
  name: "getLiveMarketQuote",
  description: "Fetches live price, NAV, or quote for financial assets like Nifty 50, Sensex, Gold price, or mutual funds in India.",
  parameters: {
    type: "OBJECT",
    properties: {
      assetName: {
        type: "STRING",
        description: "The name of the asset (e.g. 'Nifty 50', 'Sensex', 'Gold', or mutual fund names like 'Parag Parikh Flexi Cap Fund')."
      },
      assetType: {
        type: "STRING",
        enum: ["stock", "mutual_fund", "index", "gold"],
        description: "The category of asset: stock, mutual_fund, index, or gold."
      }
    },
    required: ["assetName", "assetType"]
  }
};

// ──────────────────────────────────────────────────
// 🧠 FRIDAY'S PERSONALITY
// ──────────────────────────────────────────────────
const FRIDAY_PERSONA = `
You are FRIDAY (Financial Resource Intelligent Daily Assistant for You),
an AI financial advisor inspired by Tony Stark's AI assistant.

## Rules:
- Call the user "Boss" sometimes (not every sentence)
- Be confident, witty, and professional
- Use Indian financial context (INR ₹, Indian tax laws, NSE/BSE, Indian MFs)
- Give SPECIFIC numbers — exact amounts, fund names, stock symbols
- Format currency as ₹XX,XXX
- Use emojis sparingly: 💰📈💡🎯✅⚠️
- End advice with clear ACTION ITEMS
- Never guarantee returns
- Always mention risk with investments
- Be proactive — suggest things user hasn't asked

## Financial Rules:
- 50/30/20 Rule baseline (Needs 50% / Wants 30% / Savings 20%)
- Emergency fund = 6 months expenses minimum
- EMIs should not exceed 40% of salary
- SIP > Lump sum (generally)
- Diversify: Equity 60-70%, Debt 20-30%, Gold 5-10%
- Max out 80C (₹1.5L) and 80D (₹25K health insurance)

## Structured Output Cards:
Whenever you present numerical summaries, tables, fund lists, or progress targets (especially in response to allocation queries, investment queries, or portfolio status requests), you MUST append a structured JSON card at the very end of your response inside a [STRUCTURED_CARD]...[/STRUCTURED_CARD] block. Do NOT put standard markdown tables if you can use a structured card.
Use one of the following schemas for the card content:

1. Table Card Schema (for budget/salary allocations):
[STRUCTURED_CARD]
{
  "type": "table",
  "title": "Salary Allocation Breakdown",
  "headers": ["Category", "Amount", "Allocation %"],
  "rows": [
    ["EMI", "₹12,000", "20%"],
    ["Rent", "₹15,000", "25%"],
    ["SIP", "₹10,000", "16%"],
    ["Remaining", "₹23,000", "39%"]
  ]
}
[/STRUCTURED_CARD]

2. Progress Card Schema (for goals/emergency funds):
[STRUCTURED_CARD]
{
  "type": "progress",
  "title": "Emergency Fund Goal",
  "label": "Target Goal Progress",
  "current": 15000,
  "target": 50000,
  "unit": "₹"
}
[/STRUCTURED_CARD]

3. Recommendations Card Schema (for investment tips):
[STRUCTURED_CARD]
{
  "type": "recommendations",
  "title": "SIP Portfolio Suggestions",
  "items": [
    {"name": "Parag Parikh Flexi Cap Fund", "amount": "₹5,000", "action": "Start SIP", "reason": "Consistent 5-year returns (~18% CAGR)"},
    {"name": "Quant Active Fund", "amount": "₹3,000", "action": "Start SIP", "reason": "Aggressive growth style suited for your risk profile"}
  ]
}
[/STRUCTURED_CARD]

4. Metrics Card Schema (for quick portfolio/spending health metrics):
[STRUCTURED_CARD]
{
  "type": "metrics",
  "title": "Portfolio Health Overview",
  "items": [
    {"label": "Total Invested", "value": "₹1,30,000", "subtext": "Principal amount"},
    {"label": "Current Value", "value": "₹1,51,000", "subtext": "+16.15% YTD gain"}
  ]
}
[/STRUCTURED_CARD]

Always ensure the JSON inside [STRUCTURED_CARD]...[/STRUCTURED_CARD] is perfectly valid JSON without backticks, syntax errors, or wrapping comments.
`;

export class FridayAgent {
  constructor() {
    this.salaryAnalyzer = new SalaryAnalyzer();
    this.investmentAdvisor = new InvestmentAdvisor();
    this.stockService = new StockService();
    this.mfService = new MutualFundService();
    
    // Custom model instance for chat with market quote tools enabled
    this.chatModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
      tools: [{
        functionDeclarations: [getLiveMarketQuoteDeclaration]
      }]
    });
  }

  async executeLiveMarketQuote(assetName, assetType) {
    try {
      console.log(`Executing tool getLiveMarketQuote for ${assetName} (${assetType})`);
      
      if (assetType === 'gold') {
        const goldUsd = await this.stockService.getStockPrice("GC=F");
        const usdinrData = await this.stockService.getStockPrice("USDINR=X");
        const usdRate = usdinrData.currentPrice || 83.5;
        if (goldUsd && goldUsd.currentPrice) {
          const goldPricePerGramUsd = goldUsd.currentPrice / 31.1034768;
          const goldPricePer10gInr = goldPricePerGramUsd * 10 * usdRate;
          return {
            success: true,
            asset: "Gold (24K, 10 grams)",
            priceINR: Math.round(goldPricePer10gInr),
            priceUSDPerOunce: goldUsd.currentPrice,
            usdInrRate: usdRate,
            dayChange: goldUsd.dayChange,
            source: "Yahoo Finance (GC=F)"
          };
        }
        return { success: false, error: "Gold price unavailable" };
      }
      
      if (assetType === 'index') {
        let symbol = "^NSEI";
        if (assetName.toLowerCase().includes("sensex")) {
          symbol = "^BSESN";
        }
        const data = await this.stockService.getStockPrice(symbol);
        return {
          success: true,
          asset: symbol === "^NSEI" ? "Nifty 50" : "Sensex",
          symbol,
          currentPrice: data.currentPrice,
          dayChange: data.dayChange,
          previousClose: data.previousClose,
          source: "Yahoo Finance"
        };
      }

      if (assetType === 'mutual_fund') {
        // First search for the fund code
        const searchResults = await this.mfService.searchFund(assetName);
        if (searchResults && searchResults.length > 0) {
          const code = searchResults[0].schemeCode;
          const data = await this.mfService.getFundData(code);
          return {
            success: true,
            asset: data.fundName,
            schemeCode: data.schemeCode,
            category: data.category,
            latestNAV: data.latestNAV,
            navDate: data.navDate,
            returns: data.returns,
            source: "MFAPI.in"
          };
        }
        // Fallback: look up popular funds key
        const keys = Object.keys(this.mfService.popularFunds);
        const matchKey = keys.find(k => k.toLowerCase().includes(assetName.toLowerCase()));
        if (matchKey) {
          const code = this.mfService.popularFunds[matchKey];
          const data = await this.mfService.getFundData(code);
          return {
            success: true,
            asset: data.fundName,
            schemeCode: data.schemeCode,
            category: data.category,
            latestNAV: data.latestNAV,
            navDate: data.navDate,
            returns: data.returns,
            source: "MFAPI.in"
          };
        }
        return { success: false, error: `Mutual fund '${assetName}' not found` };
      }

      if (assetType === 'stock') {
        let symbol = assetName.toUpperCase();
        if (!symbol.includes(".NS")) {
          symbol = `${symbol}.NS`;
        }
        const data = await this.stockService.getStockPrice(symbol);
        if (data.error) {
          return { success: false, error: data.error };
        }
        return {
          success: true,
          asset: data.symbol,
          currentPrice: data.currentPrice,
          dayChange: data.dayChange,
          fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: data.fiftyTwoWeekLow,
          source: "Yahoo Finance"
        };
      }

      return { success: false, error: "Invalid asset type" };
    } catch (e) {
      console.error("Error executing market quote tool:", e);
      return { success: false, error: e.message };
    }
  }

  // ══════════════════════════════════════════════
  // 💬 General Chat with FRIDAY
  // ══════════════════════════════════════════════
  async chat(userId, message) {
    try {
      // Gather user context
      const context = await this._getUserContext(userId);

      const prompt = `
${FRIDAY_PERSONA}

## User Context:
${JSON.stringify(context, null, 2)}

## User Message:
${message}

## Instructions:
Based on the user's financial data and their message, provide helpful, 
specific financial advice. If they ask about investments, use the portfolio 
data. If they ask about expenses, analyze spending patterns. 
Always be actionable and specific with Indian financial products.
You can use the getLiveMarketQuote tool to search for live market prices, gold rates, or mutual fund NAVs if they ask.

Respond naturally as FRIDAY:
`;

      const genAIArgs = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{
          functionDeclarations: [getLiveMarketQuoteDeclaration]
        }]
      };

      let result = await this.chatModel.generateContent(genAIArgs);
      let responseText = "";

      // Check for function calls
      const functionCalls = result.response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        console.log("Model requested tool call:", call.name, call.args);
        
        let toolResult;
        if (call.name === "getLiveMarketQuote") {
          toolResult = await this.executeLiveMarketQuote(call.args.assetName, call.args.assetType);
        } else {
          toolResult = { error: "Unknown tool" };
        }

        // Send function execution result back to Gemini
        const followUpArgs = {
          contents: [
            { role: "user", parts: [{ text: prompt }] },
            result.response.candidates[0].content, // model call response
            {
              role: "function",
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: { result: toolResult }
                }
              }]
            }
          ],
          tools: [{
            functionDeclarations: [getLiveMarketQuoteDeclaration]
          }]
        };

        const followUpResult = await this.chatModel.generateContent(followUpArgs);
        responseText = followUpResult.response.text();
      } else {
        responseText = result.response.text();
      }

      return {
        success: true,
        message: responseText,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("FRIDAY Chat Error:", error.message);
      return {
        success: false,
        message: "Sorry Boss, I hit a snag. Let me try again. 🔄",
        error: error.message,
      };
    }
  }

  // ══════════════════════════════════════════════
  // 💰 Handle Salary Credited — THE MAIN FLOW
  // ══════════════════════════════════════════════
  async handleSalaryCredited(userId, salaryAmount) {
    try {
      // Step 1: Get user data
      const user = await User.findById(userId);
      const context = await this._getUserContext(userId);

      // Step 2: Calculate default allocation
      const defaultAllocation = await this.salaryAnalyzer
        .calculateAllocation(userId, salaryAmount);

      // Step 3: Get AI-powered personalization from Gemini
      const prompt = `
${FRIDAY_PERSONA}

## Task: Salary Allocation Analysis
Boss just got salary credited: ₹${salaryAmount.toLocaleString("en-IN")}

## User's Financial Profile:
${JSON.stringify(context, null, 2)}

## Default Allocation Calculated:
${JSON.stringify(defaultAllocation, null, 2)}

## Instructions:
1. Review the default allocation and ADJUST it based on user's actual spending history
2. Identify areas where they overspend
3. Suggest specific investments for this month's SIP/investment amount
4. Check if they should increase/decrease any category
5. Give 3-5 specific action items

## IMPORTANT: Respond in this EXACT JSON format:
{
  "greeting": "A personalized welcome message for the boss",
  "adjustedAllocation": {
    "emi": <number>,
    "rent": <number>,
    "sip": <number>,
    "travel": <number>,
    "bills": <number>,
    "groceries": <number>,
    "entertainment": <number>,
    "savings": <number>,
    "remaining": <number>
  },
  "insights": [
    "Insight 1 about their spending",
    "Insight 2 about investments",
    "Insight 3 about savings"
  ],
  "investmentAdvice": {
    "totalToInvest": <number>,
    "suggestions": [
      {"name": "Fund/Stock Name", "type": "SIP/Stock/MF", "amount": <number>, "reason": "Why"},
    ]
  },
  "warnings": ["Any financial warnings"],
  "actionItems": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3"
  ]
}
`;

      const result = await geminiProModel.generateContent(prompt);
      let responseText = result.response.text();

      // Clean up Gemini response (remove markdown code blocks if any)
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, use default allocation with generic insights
        console.warn("Gemini response not valid JSON, using defaults");
        aiAnalysis = {
          greeting: `Welcome back, Boss! 💰 ₹${salaryAmount.toLocaleString("en-IN")} credited. Let me sort this out for you.`,
          adjustedAllocation: defaultAllocation.allocation,
          insights: [
            "Based on your spending patterns, I've optimized your allocation.",
            `₹${defaultAllocation.allocation.sip.toLocaleString("en-IN")} set aside for investments this month.`,
            "Your emergency fund is being tracked.",
          ],
          investmentAdvice: {
            totalToInvest: defaultAllocation.allocation.sip,
            suggestions: [
              {
                name: "Parag Parikh Flexi Cap Fund",
                type: "SIP",
                amount: Math.round(defaultAllocation.allocation.sip * 0.5),
                reason: "Consistent long-term performer",
              },
              {
                name: "Mirae Asset Tax Saver Fund",
                type: "ELSS",
                amount: Math.round(defaultAllocation.allocation.sip * 0.3),
                reason: "Tax saving under 80C",
              },
              {
                name: "Nifty 50 Index Fund",
                type: "Index",
                amount: Math.round(defaultAllocation.allocation.sip * 0.2),
                reason: "Low cost market exposure",
              },
            ],
          },
          warnings: defaultAllocation.warnings,
          actionItems: [
            `Set up SIP of ₹${defaultAllocation.allocation.sip.toLocaleString("en-IN")} if not done`,
            "Review your EMIs — check if any can be prepaid",
            "Track daily expenses this month",
          ],
        };
      }

      // Step 4: Get live stock recommendations (free Yahoo Finance)
      let stockInsights = null;
      try {
        stockInsights = await this.stockService.getQuickInsights();
      } catch (e) {
        console.warn("Stock insights unavailable:", e.message);
      }

      // Step 5: Get mutual fund recommendations (free MFAPI)
      let mfInsights = null;
      try {
        mfInsights = await this.mfService.getTopPerformers("flexi_cap", 3);
      } catch (e) {
        console.warn("MF insights unavailable:", e.message);
      }

      return {
        success: true,
        greeting: aiAnalysis.greeting,
        defaultAllocation: defaultAllocation.allocation,
        aiAllocation: aiAnalysis.adjustedAllocation,
        insights: aiAnalysis.insights,
        investmentAdvice: aiAnalysis.investmentAdvice,
        warnings: aiAnalysis.warnings || [],
        actionItems: aiAnalysis.actionItems || [],
        stockInsights,
        mfInsights,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Salary analysis error:", error);

      // Graceful fallback — always works even if Gemini is down
      const fallback = await this.salaryAnalyzer
        .calculateAllocation(userId, salaryAmount);

      return {
        success: true,
        greeting: `Welcome back, Boss! 💰 ₹${salaryAmount.toLocaleString("en-IN")} noted. Here's your allocation.`,
        defaultAllocation: fallback.allocation,
        aiAllocation: fallback.allocation,
        insights: [
          "Default allocation applied based on your profile.",
          "AI personalization temporarily unavailable.",
        ],
        investmentAdvice: {
          totalToInvest: fallback.allocation.sip,
          suggestions: [],
        },
        warnings: fallback.warnings,
        actionItems: ["Review allocation and adjust if needed"],
        stockInsights: null,
        mfInsights: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ══════════════════════════════════════════════
  // 📈 Get Investment Advice
  // ══════════════════════════════════════════════
  async getInvestmentAdvice(userId, budget) {
    try {
      const context = await this._getUserContext(userId);

      // Fetch live market data (free)
      const [stockData, mfData] = await Promise.allSettled([
        this.stockService.getQuickInsights(),
        this.mfService.getTopPerformers("flexi_cap", 5),
      ]);

      const prompt = `
${FRIDAY_PERSONA}

## Task: Investment Advice
Boss has ₹${budget.toLocaleString("en-IN")} to invest this month.

## Current Portfolio:
${JSON.stringify(context.investments, null, 2)}

## Live Market Data:
Stocks: ${JSON.stringify(stockData.status === "fulfilled" ? stockData.value : "unavailable")}
Mutual Funds: ${JSON.stringify(mfData.status === "fulfilled" ? mfData.value : "unavailable")}

## User Profile:
Risk Profile: ${context.profile?.riskProfile || "moderate"}
Investment Goal: ${context.profile?.investmentGoal || "wealth creation"}

## Instructions:
Give specific investment recommendations with:
1. Exact fund names / stock symbols
2. Exact amounts to invest in each
3. Why each recommendation (1 line reason)
4. Risk level for each
5. Whether to sell any existing holding
6. Tax saving opportunities

Keep total recommendations = budget amount (₹${budget.toLocaleString("en-IN")})
Be specific and actionable. Indian context only.
`;

      const result = await geminiProModel.generateContent(prompt);
      return {
        success: true,
        advice: result.response.text(),
        marketData: {
          stocks: stockData.status === "fulfilled" ? stockData.value : null,
          mutualFunds: mfData.status === "fulfilled" ? mfData.value : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        advice: "Sorry Boss, couldn't fetch investment advice right now. Try again in a minute. 🔄",
        error: error.message,
      };
    }
  }

  // ══════════════════════════════════════════════
  // 📊 Spending Analysis
  // ══════════════════════════════════════════════
  async getSpendingAnalysis(userId) {
    try {
      const context = await this._getUserContext(userId);

      const prompt = `
${FRIDAY_PERSONA}

## Task: Spending Analysis
Analyze Boss's spending patterns and provide insights.

## Expense Data (Last 3 Months):
${JSON.stringify(context.recentExpenses, null, 2)}

## Monthly Summary:
${JSON.stringify(context.expenseSummary, null, 2)}

## Salary: ₹${context.profile?.monthlySalary?.toLocaleString("en-IN") || "Unknown"}

## Instructions:
1. Identify top 3 spending categories
2. Find areas of overspending
3. Compare with recommended budgets for Indian households
4. Suggest specific ways to save ₹X amount
5. Identify recurring expenses that can be reduced
6. Give a spending health score (1-10)

Be specific with amounts and percentages.
`;

      const result = await geminiModel.generateContent(prompt);
      return {
        success: true,
        analysis: result.response.text(),
      };
    } catch (error) {
      return {
        success: false,
        analysis: "Spending analysis temporarily unavailable. 🔄",
        error: error.message,
      };
    }
  }

  // ══════════════════════════════════════════════
  // 🔍 Portfolio Review
  // ══════════════════════════════════════════════
  async getPortfolioReview(userId) {
    try {
      const investments = await Investment.find({ userId, isActive: true });

      // Get live prices for stocks
      const stockHoldings = investments.filter(
        (i) => i.type === "stock" && i.stockDetails?.symbol
      );

      const livePrices = {};
      for (const stock of stockHoldings) {
        try {
          const data = await this.stockService
            .getStockPrice(stock.stockDetails.symbol);
          livePrices[stock.stockDetails.symbol] = data;
        } catch (e) {
          // Skip if can't fetch
        }
      }

      const prompt = `
${FRIDAY_PERSONA}

## Task: Portfolio Review
Give Boss a complete portfolio health check.

## Current Holdings:
${JSON.stringify(
  investments.map((i) => ({
    name: i.name,
    type: i.type,
    invested: i.investedAmount,
    current: i.currentValue,
    returnPercent: i.returns?.percentage,
    tags: i.tags,
  })),
  null,
  2
)}

## Live Stock Prices:
${JSON.stringify(livePrices, null, 2)}

## Instructions:
1. Overall portfolio health assessment
2. Identify top performers (keep/add more)
3. Identify underperformers (sell/hold?)
4. Diversification check — is portfolio balanced?
5. Tax harvesting opportunities (book losses to offset gains)
6. Specific buy/sell/hold for each holding
7. Give portfolio score (1-10)

Be direct and specific. Boss wants actionable advice.
`;

      const result = await geminiProModel.generateContent(prompt);
      return {
        success: true,
        review: result.response.text(),
        livePrices,
      };
    } catch (error) {
      return {
        success: false,
        review: "Portfolio review temporarily unavailable. 🔄",
        error: error.message,
      };
    }
  }

  // ══════════════════════════════════════════════
  // 💡 Get Telemetry Insight (Powered by Gemini)
  // ══════════════════════════════════════════════
  async getTelemetryInsight(userId) {
    try {
      const context = await this._getUserContext(userId);

      const prompt = `
${FRIDAY_PERSONA}

## Task: Financial Telemetry Insight
Generate a single-line financial tip or insight using the Boss's financial telemetry.

## User Context:
${JSON.stringify(context, null, 2)}

## Instructions:
1. Provide a single, personalized, actionable financial tip or insight in Indian financial context (INR).
2. It should be concise (around 15-25 words).
3. Focus on savings, investing, or optimization based on their actual numbers.
4. Format: Plain text. Do NOT use markdown bolding (like **) or JSON formatting. Just return a single clean sentence.

Respond as FRIDAY:
`;

      const result = await geminiModel.generateContent(prompt);
      let insight = result.response.text().trim();

      // Clean up markdown/formatting
      insight = insight.replace(/\*\*/g, "").replace(/`/g, "").trim();

      return {
        success: true,
        insight,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Telemetry Insight Error:", error.message);
      return {
        success: false,
        insight: "Your ELSS SIP is up 14.2% YTD. Consider increasing by ₹500 — it saves you tax under Sec 80C, Boss.",
        error: error.message,
      };
    }
  }

  // ══════════════════════════════════════════════
  // 🔧 Get User Context (Used by all methods)
  // ══════════════════════════════════════════════
  async _getUserContext(userId) {
    const [user, expenses, investments, lastSalary] = await Promise.all([
      User.findById(userId).select("-password").lean(),
      Expense.find({ userId })
        .sort({ date: -1 })
        .limit(100)
        .lean(),
      Investment.find({ userId, isActive: true }).lean(),
      Salary.findOne({ userId })
        .sort({ creditDate: -1 })
        .lean(),
    ]);

    const profile = user?.financialProfile || {};
    const salary = lastSalary?.amount || profile.monthlySalary || 0;
    
    // Fixed & discretionary commitments
    const emi = lastSalary?.allocation?.emi ?? profile.fixedExpenses?.emiDefault ?? 0;
    const rent = lastSalary?.allocation?.rent ?? profile.fixedExpenses?.rent ?? 0;
    const sip = lastSalary?.allocation?.sip ?? profile.sipDefault ?? 0;
    const travel = lastSalary?.allocation?.travel ?? profile.travelDefault ?? 0;
    const bills = lastSalary?.allocation?.bills ?? profile.billsDefault ?? 0;
    
    const totalAllocated = emi + rent + sip + travel + bills;
    const availableBalance = salary - totalAllocated;

    // Calculate expense summary
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentExpenses = expenses.filter(
      (e) => new Date(e.date) >= threeMonthsAgo
    );

    const expenseSummary = {};
    recentExpenses.forEach((e) => {
      if (!expenseSummary[e.category]) {
        expenseSummary[e.category] = { total: 0, count: 0 };
      }
      expenseSummary[e.category].total += e.amount;
      expenseSummary[e.category].count += 1;
    });

    // Calculate monthly average per category
    Object.keys(expenseSummary).forEach((cat) => {
      expenseSummary[cat].monthlyAvg = Math.round(
        expenseSummary[cat].total / 3
      );
    });

    return {
      userName: user?.name || "Boss",
      monthlySalary: salary,
      commitments: {
        emi,
        rent,
        sip,
        travel,
        bills,
        totalAllocated
      },
      availableBalance,
      portfolio: {
        totalInvested: investments.reduce((s, i) => s + i.investedAmount, 0),
        totalCurrentValue: investments.reduce((s, i) => s + i.currentValue, 0),
        holdings: investments.map((i) => ({
          name: i.name,
          type: i.type,
          invested: i.investedAmount,
          current: i.currentValue,
          gainAmount: i.returns?.absolute || (i.currentValue - i.investedAmount),
          gainPercent: i.returns?.percentage || (i.investedAmount > 0 ? (((i.currentValue - i.investedAmount) / i.investedAmount) * 100) : 0),
        }))
      },
      expenseSummary,
      recentExpenses: recentExpenses.slice(0, 20),
    };
  }
}

export default FridayAgent;