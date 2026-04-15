import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import Investment from "../../models/Investment.js";

export const createPortfolioAnalysisTool = (userId, investmentAdvisor) => {
  return new DynamicStructuredTool({
    name: "portfolio_analysis",
    description: `Analyze the user's complete investment portfolio. Get current holding values, performance, and asset allocation strategy.
    Does not require any arguments, just returns the user's portfolio state.`,
    schema: z.object({}),
    func: async () => {
      try {
        const investments = await Investment.find({ userId });
        const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
        const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        
        return JSON.stringify({
          totalHoldings: investments.length,
          totalInvested,
          currentValue,
          absoluteGain: currentValue - totalInvested,
          gainPercentage: totalInvested > 0 ? (((currentValue - totalInvested) / totalInvested) * 100).toFixed(2) + "%" : "0%",
          investments: investments.map(inv => ({ name: inv.name, type: inv.type, value: inv.currentValue }))
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
  });
};
