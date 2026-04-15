// ============================================================
// 🧠 FRIDAY MASTER AGENT - The Brain of Your Financial AI
// ============================================================
// This is the core AI agent that orchestrates everything.
// It uses LangChain's Agent framework with custom tools.
// ============================================================

import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BufferWindowMemory } from "langchain/memory";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Import all FRIDAY tools
import { SalaryAllocationTool } from "./tools/salary-tool.js";
import { ExpenseTrackerTool } from "./tools/expense-tool.js";
import { InvestmentAdvisorTool } from "./tools/investment-tool.js";
import { StockLookupTool } from "./tools/stock-lookup-tool.js";
import { GrowwPortfolioTool } from "./tools/groww-tool.js";
import { PortfolioAnalysisTool } from "./tools/portfolio-analysis-tool.js";

// Import services
import { SalaryAnalyzer } from "../services/salary-analyzer.js";
import { InvestmentAdvisor } from "../services/investment-advisor.js";
import { GrowwIntegration } from "../services/groww-integration.js";

export class FridayAgent {
  constructor(userId) {
    this.userId = userId;
    this.llm = null;
    this.agent = null;
    this.executor = null;
    this.memory = null;
    this.salaryAnalyzer = new SalaryAnalyzer();
    this.investmentAdvisor = new InvestmentAdvisor();
    this.growwIntegration = new GrowwIntegration();
  }

  // ──────────────────────────────────────────────
  // 🔧 Initialize the AI Agent with all tools
  // ──────────────────────────────────────────────
  async initialize() {
    // 1. Create the LLM (Azure OpenAI or OpenAI)
    this.llm = new ChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
      azureOpenAIApiVersion: "2024-08-01-preview",
      temperature: 0.3,  // Low temp for financial accuracy
      modelName: "gpt-4o",
    });

    // 2. Create memory (remembers last 20 messages)
    this.memory = new BufferWindowMemory({
      memoryKey: "chat_history",
      returnMessages: true,
      k: 20,
    });

    // 3. Define all the tools FRIDAY can use
    const tools = this._createTools();

    // 4. Create the master prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", FRIDAY_SYSTEM_PROMPT],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    // 5. Create the agent
    this.agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools,
      prompt,
    });

    // 6. Create the executor (runs the agent)
    this.executor = new AgentExecutor({
      agent: this.agent,
      tools,
      memory: this.memory,
      verbose: process.env.NODE_ENV === "development",
      maxIterations: 5,
      returnIntermediateSteps: true,
    });

    console.log(`🤖 FRIDAY Agent initialized for user: ${this.userId}`);
    return this;
  }

  // ──────────────────────────────────────────────
  // 💬 Chat with FRIDAY
  // ──────────────────────────────────────────────
  async chat(userMessage, context = {}) {
    try {
      const enrichedInput = this._enrichInput(userMessage, context);
      
      const result = await this.executor.invoke({
        input: enrichedInput,
      });

      return {
        success: true,
        message: result.output,
        actions: this._extractActions(result.intermediateSteps),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("FRIDAY Agent Error:", error);
      return {
        success: false,
        message: "Sorry boss, I encountered an issue. Let me try again.",
        error: error.message,
      };
    }
  }

  // ──────────────────────────────────────────────
  // 💰 Handle Salary Credited Event
  // ──────────────────────────────────────────────
  async handleSalaryCredited(salaryAmount) {
    const prompt = `
      Boss just got salary credited: ₹${salaryAmount.toLocaleString('en-IN')}.
      
      Please do the following:
      1. Use the salary_allocation tool to calculate the optimal allocation
      2. Check existing investments using portfolio_analysis tool
      3. Use the investment_advisor tool to suggest where to invest this month
      4. Check if any stocks should be sold or bought using stock_lookup tool
      5. Give a complete financial summary with actionable advice
      
      Be specific with amounts, percentages, and fund/stock names.
      Remember my previous salary allocations and spending patterns.
    `;

    return await this.chat(prompt, { 
      type: "salary_credit", 
      amount: salaryAmount 
    });
  }

  // ──────────────────────────────────────────────
  // 📊 Get Investment Advice
  // ──────────────────────────────────────────────
  async getInvestmentAdvice(investmentBudget) {
    const prompt = `
      I have ₹${investmentBudget.toLocaleString('en-IN')} to invest this month.
      
      1. Check my current portfolio using groww_portfolio tool
      2. Analyze which existing investments are performing well
      3. Should I sell any underperforming stocks?
      4. Where should I put new money - mutual funds, stocks, or SIPs?
      5. Give me specific fund names and stock recommendations
      
      Consider my risk profile, current market conditions, and portfolio diversification.
    `;

    return await this.chat(prompt, {
      type: "investment_advice",
      budget: investmentBudget,
    });
  }

  // ──────────────────────────────────────────────
  // 🛠️ Create All Agent Tools
  // ──────────────────────────────────────────────
  _createTools() {
    const userId = this.userId;
    const salaryAnalyzer = this.salaryAnalyzer;
    const investmentAdvisor = this.investmentAdvisor;
    const growwIntegration = this.growwIntegration;

    return [
      // ═══════════════════════════════════════════
      // TOOL 1: Salary Allocation Calculator
      // ═══════════════════════════════════════════
      new DynamicStructuredTool({
        name: "salary_allocation",
        description: `Calculate optimal salary allocation based on user's financial profile. 
          Splits salary into EMI, rent, SIP, travel, bills, savings, and discretionary spending.
          Uses historical data and Indian financial planning best practices.`,
        schema: z.object({
          salary: z.number().describe("Monthly salary amount in INR"),
          existingEMIs: z.number().optional().describe("Total existing EMI amount"),
          rent: z.number().optional().describe("Monthly rent amount"),
          existingSIPs: z.number().optional().describe("Existing SIP commitments"),
        }),
        func: async ({ salary, existingEMIs, rent, existingSIPs }) => {
          const allocation = await salaryAnalyzer.calculateAllocation(
            userId, salary, { existingEMIs, rent, existingSIPs }
          );
          return JSON.stringify(allocation);
        },
      }),

      // ═══════════════════════════════════════════
      // TOOL 2: Expense Tracker
      // ═══════════════════════════════════════════
      new DynamicStructuredTool({
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
          const ExpenseModel = (await import("../models/Expense.js")).default;
          
          switch (action) {
            case "add":
              const expense = await ExpenseModel.create({
                userId, category, amount, description,
                date: new Date(),
              });
              return JSON.stringify({ success: true, expense });
              
            case "summary":
              const targetMonth = month || new Date().toISOString().slice(0, 7);
              const expenses = await ExpenseModel.find({
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
              
            case "analyze":
              // Get last 3 months for trend analysis
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              const recentExpenses = await ExpenseModel.find({
                userId,
                date: { $gte: threeMonthsAgo },
              });
              const monthlyTotals = {};
              recentExpenses.forEach(e => {
                const m = e.date.toISOString().slice(0, 7);
                monthlyTotals[m] = (monthlyTotals[m] || 0) + e.amount;
              });
              return JSON.stringify({ trend: monthlyTotals, totalExpenses: recentExpenses.length });
              
            case "category_breakdown":
              const allExpenses = await ExpenseModel.find({ userId })
                .sort({ date: -1 }).limit(100);
              const breakdown = allExpenses.reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount;
                return acc;
              }, {});
              return JSON.stringify(breakdown);
              
            default:
              return JSON.stringify({ error: "Unknown action" });
          }
        },
      }),

      // ═══════════════════════════════════════════
      // TOOL 3: Investment Advisor
      // ═══════════════════════════════════════════
      new DynamicStructuredTool({
        name: "investment_advisor",
        description: `Provide investment recommendations based on user profile, 
          risk tolerance, and current market conditions. Suggests mutual funds, 
          stocks, SIPs, ETFs with specific amounts.`,
        schema: z.object({
          budget: z.number().describe("Amount available to invest in INR"),
          riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
          investmentGoal: z.string().optional().describe("e.g., retirement, wealth creation, tax saving"),
          timeHorizon: z.string().optional().describe("e.g., 1 year, 5 years, 10 years"),
        }),
        func: async ({ budget, riskProfile, investmentGoal, timeHorizon }) => {
          const advice = await investmentAdvisor.getRecommendations(
            userId, budget, { riskProfile, investmentGoal, timeHorizon }
          );
          return JSON.stringify(advice);
        },
      }),

      // ═══════════════════════════════════════════
      // TOOL 4: Stock Lookup & Analysis
      // ═══════════════════════════════════════════
      new DynamicStructuredTool({
        name: "stock_lookup",
        description: `Look up real-time stock data from NSE/BSE. Get current price,
          52-week high/low, P/E ratio, and technical analysis.
          Can also check if a stock should be bought, held, or sold.`,
        schema: z.object({
          symbol: z.string().describe("Stock symbol e.g., RELIANCE, TCS, INFY"),
          action: z.enum(["price", "analysis", "should_buy", "should_sell"]),
        }),
        func: async ({ symbol, action }) => {
          // Uses Yahoo Finance API or NSE API
          const stockData = await fetchStockData(symbol, action);
          return JSON.stringify(stockData);
        },
      }),

      // ═══════════════════════════════════════════
      // TOOL 5: Groww Portfolio Integration
      // ═══════════════════════════════════════════
      new DynamicStructuredTool({
        name: "groww_portfolio",
        description: `Access user's Groww portfolio data. Get current holdings,
          returns, SIP details, mutual fund NAVs, and portfolio performance.`,
        schema: z.object({
          action: z.enum([
            "get_holdings",
            "get_sips",
            "get_returns",
            "fund_performance",
            "portfolio_summary"
          ]),
          fundName: z.string().optional(),
        }),
        func: async ({ action, fundName }) => {
          const data = await growwIntegration.query(userId, action, { fundName });
          return JSON.stringify(data);
        },
      }),

      // ═══════════════════════════════════════════
      // TOOL 6: Portfolio Analysis & Rebalancing
      // ═══════════════════════════════════════════
      new DynamicStructuredTool({
        name: "portfolio_analysis",
        description: `Analyze the complete investment portfolio. Check asset allocation,
          diversification, risk exposure, and suggest rebalancing actions.
          Can identify underperformers and overweight positions.`,
        schema: z.object({
          analysisType: z.enum([
            "full_analysis",
            "rebalance_suggestions",
            "risk_assessment",
            "tax_harvesting",
            "sell_recommendations"
          ]),
        }),
        func: async ({ analysisType }) => {
          const InvestmentModel = (await import("../models/Investment.js")).default;
          const investments = await InvestmentModel.find({ userId });
          
          const analysis = await investmentAdvisor.analyzePortfolio(
            investments, analysisType
          );
          return JSON.stringify(analysis);
        },
      }),
    ];
  }

  // ──────────────────────────────────────────────
  // 🔧 Helper Methods
  // ──────────────────────────────────────────────
  _enrichInput(message, context) {
    let enriched = message;
    if (context.type === "salary_credit") {
      enriched = `[SALARY CREDITED: ₹${context.amount}] ${message}`;
    }
    return enriched;
  }

  _extractActions(steps) {
    if (!steps) return [];
    return steps.map(step => ({
      tool: step.action.tool,
      input: step.action.toolInput,
      result: step.observation,
    }));
  }
}

// ═══════════════════════════════════════════════════
// 🧠 FRIDAY'S PERSONALITY & SYSTEM PROMPT
// ═══════════════════════════════════════════════════
const FRIDAY_SYSTEM_PROMPT = `
You are FRIDAY (Financial Resource Intelligent Daily Assistant for You), 
an AI financial advisor inspired by Tony Stark's AI assistant.

## Your Personality:
- Address the user as "Boss" naturally (not every sentence, but frequently)
- Be confident, witty, and professional — like a mix of a financial advisor and a loyal AI assistant
- Use Indian financial context (INR, Indian tax laws, Indian mutual funds, NSE/BSE stocks)
- Be specific — give exact numbers, fund names, stock symbols
- When the boss's salary is credited, be excited and proactive

## Your Capabilities:
1. **Salary Management**: Automatically allocate salary into EMI, rent, SIP, travel, bills, savings
2. **Expense Tracking**: Track every expense, identify patterns, suggest savings
3. **Investment Advisory**: Recommend mutual funds, stocks, ETFs based on risk profile
4. **Portfolio Management**: Analyze existing investments, suggest rebalancing, identify sell opportunities
5. **Tax Planning**: Suggest tax-saving instruments (ELSS, PPF, NPS, HRA)
6. **Market Analysis**: Check stock prices, analyze trends, give buy/sell signals

## Financial Rules You Follow:
- 50/30/20 Rule as baseline (Needs/Wants/Savings)
- Emergency fund = 6 months expenses
- Never recommend more than 30% salary in EMIs
- SIP first, lump sum when market dips
- Diversification: Equity (60-70%), Debt (20-30%), Gold (5-10%)
- Tax saving: Max out 80C (₹1.5L), 80D (₹25K health insurance)

## Response Format:
- Use emojis sparingly but effectively (💰📈💡🎯)
- Use bullet points for clarity
- Always end financial advice with a clear action item
- If unsure about market data, say so honestly
- Format currency as ₹XX,XXX (Indian number system)

## Important:
- Never give guarantees on returns
- Always mention risk with investments
- Remind about emergency fund if not set up
- Be proactive — suggest things the boss hasn't asked about
`;

// ═══════════════════════════════════════════════════
// 📊 Stock Data Fetcher (Helper)
// ═══════════════════════════════════════════════════
async function fetchStockData(symbol, action) {
  try {
    // Using Yahoo Finance API (free tier)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=3mo`
    );
    const data = await response.json();
    const quote = data.chart.result[0];
    const meta = quote.meta;
    const prices = quote.indicators.quote[0];
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);
    
    const result = {
      symbol: symbol,
      currentPrice: currentPrice,
      previousClose: previousClose,
      changePercent: `${change}%`,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      currency: "INR",
    };

    if (action === "should_buy") {
      const nearLow = currentPrice <= meta.fiftyTwoWeekLow * 1.1;
      result.recommendation = nearLow 
        ? "POTENTIAL BUY - Stock is near 52-week low" 
        : currentPrice >= meta.fiftyTwoWeekHigh * 0.95 
          ? "CAUTION - Stock is near 52-week high" 
          : "HOLD - Stock is in neutral territory";
    }

    if (action === "should_sell") {
      const nearHigh = currentPrice >= meta.fiftyTwoWeekHigh * 0.95;
      result.recommendation = nearHigh 
        ? "CONSIDER SELLING - Near 52-week high, book profits" 
        : "HOLD - No immediate sell signal";
    }

    return result;
  } catch (error) {
    return { 
      symbol, 
      error: "Could not fetch stock data", 
      message: error.message,
      fallback: "Please check NSE/BSE website for live data" 
    };
  }
}

export default FridayAgent;