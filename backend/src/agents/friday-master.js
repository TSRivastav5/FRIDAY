// ============================================================
// 🧠 FRIDAY MASTER AGENT - The Brain of Your Financial AI
// ============================================================
// This is the core AI agent that orchestrates everything using LangChain
// and the FREE Gemini API.
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createOpenAIToolsAgent, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BufferWindowMemory } from "langchain/memory";

// Import custom tools
import { createSalaryAllocationTool } from "./tools/salary-tool.js";
import { createExpenseTrackerTool } from "./tools/expense-tool.js";
import { createInvestmentAdvisorTool } from "./tools/investment-tool.js";
import { createStockLookupTool } from "./tools/stock-lookup-tool.js";
import { createPortfolioAnalysisTool } from "./tools/portfolio-analysis-tool.js";

// Import services
import { SalaryAnalyzer } from "../services/salary-analyzer.js";
import { InvestmentAdvisor } from "../services/investment-advisor.js";

const FRIDAY_SYSTEM_PROMPT = `
You are FRIDAY (Financial Resource Intelligent Daily Assistant for You), 
an AI financial advisor designed to help the user master their money. 
You address the user as "Boss" occasionally.

## Your Capabilities & Tools:
1. **salary_allocation**: Calculate how to split the monthly salary. Use this immediately when salary is credited.
2. **expense_tracker**: Add, summarize, or analyze the Boss's expenses.
3. **investment_advisor**: Provide investment advice based on budget and risk.
4. **stock_lookup**: Fetch live market data to recommend buys or sells.
5. **portfolio_analysis**: Review the user's complete investment portfolio health.

## Financial Rules:
- 50/30/20 Rule as baseline (Needs/Wants/Savings)
- Emergency fund = 6 months expenses
- Diversification: Equity (60-70%), Debt (20-30%), Gold (5-10%)
- Be specific — give exact numbers, fund names, stock symbols in INR (₹).

IMPORTANT: You are a smart assistant. Always use the appropriate tool when asked to perform a task. If the user asks for investment advice, use the 'investment_advisor' tool. If they ask to track an expense, use 'expense_tracker'. Provide your final response in clear, readable Markdown.
`;

export class FridayAgent {
  constructor(userId) {
    this.userId = userId;
    this.salaryAnalyzer = new SalaryAnalyzer();
    this.investmentAdvisor = new InvestmentAdvisor();
  }

  async initialize() {
    // 1. Initialize Gemini using the free @langchain/google-genai package
    const llm = new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-pro",
      maxRetries: 2,
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3, // Low temperature for consistent financial advice
    });

    // 2. Memory
    this.memory = new BufferWindowMemory({
      memoryKey: "chat_history",
      returnMessages: true,
      k: 10, // Remember last 10 turns
    });

    // 3. Define Tools
    const tools = [
      createSalaryAllocationTool(this.userId, this.salaryAnalyzer),
      createExpenseTrackerTool(this.userId),
      createInvestmentAdvisorTool(this.userId, this.investmentAdvisor),
      createStockLookupTool(),
      createPortfolioAnalysisTool(this.userId, this.investmentAdvisor)
    ];

    // 4. Create Prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", FRIDAY_SYSTEM_PROMPT],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    // 5. Create Tool Calling Agent (Gemini supports tool usage via Function Calling)
    this.agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    // 6. Executor
    this.executor = new AgentExecutor({
      agent: this.agent,
      tools,
      memory: this.memory,
      verbose: true,
      maxIterations: 5,
    });

    return this;
  }

  async chat(userMessage, context = {}) {
    try {
      let enrichedInput = userMessage;
      if (context.type === "salary_credit") {
        enrichedInput = `[SYSTEM EVENT: Salary credited: ₹${context.amount}] ${userMessage}`;
      } else if (context.type === "investment_advice") {
        enrichedInput = `[SYSTEM EVENT: Requesting investment advice for budget ₹${context.budget}] ${userMessage}`;
      }

      const result = await this.executor.invoke({
        input: enrichedInput,
      });

      return {
        success: true,
        message: result.output,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("FRIDAY Agent Error:", error);
      return {
        success: false,
        message: "Sorry Boss, I encountered an issue while communicating with my central processors. Let me try again later.",
        error: error.message,
      };
    }
  }

  async handleSalaryCredited(salaryAmount) {
    const prompt = `
      Boss just got salary credited: ₹${salaryAmount}
      
      Please do the following:
      1. Use the salary_allocation tool to calculate the optimal allocation
      2. Check existing investments using portfolio_analysis tool
      3. Use the investment_advisor tool to suggest where to invest this month
      4. Give a complete financial summary with actionable advice
    `;

    return await this.chat(prompt, { 
      type: "salary_credit", 
      amount: salaryAmount 
    });
  }

  async getInvestmentAdvice(investmentBudget) {
    const prompt = `
      I have ₹${investmentBudget} to invest this month.
      
      1. Analyze which existing investments are performing well using portfolio_analysis.
      2. Where should I put new money using investment_advisor?
      3. Give me specific fund names and stock recommendations.
    `;

    return await this.chat(prompt, {
      type: "investment_advice",
      budget: investmentBudget,
    });
  }
}

export default FridayAgent;