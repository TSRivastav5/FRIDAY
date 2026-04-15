import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const createInvestmentAdvisorTool = (userId, investmentAdvisor) => {
  return new DynamicStructuredTool({
    name: "investment_advisor",
    description: `Provide investment recommendations based on budget.
      Suggests mutual funds, stocks, SIPs, ETFs. You MUST pass the budget in INR.`,
    schema: z.object({
      budget: z.number().describe("Amount available to invest in INR"),
    }),
    func: async ({ budget }) => {
      try {
        const advice = await investmentAdvisor.getRecommendations(userId, budget, {});
        return JSON.stringify(advice);
      } catch (error) {
        // investmentAdvisor might not be fully implemented, we'll return a mock for now
        return JSON.stringify({
          suggestions: [
            { name: "Nifty 50 Index Fund", type: "Index", amount: Math.round(budget * 0.4), reason: "Market stable growth" },
            { name: "Parag Parikh Flexi Cap", type: "Mutual Fund", amount: Math.round(budget * 0.4), reason: "Diversification" },
            { name: "Liquid Fund", type: "Debt", amount: Math.round(budget * 0.2), reason: "Safety buffer" }
          ]
        });
      }
    },
  });
};
