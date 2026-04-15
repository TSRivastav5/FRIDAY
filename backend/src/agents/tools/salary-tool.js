import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const createSalaryAllocationTool = (userId, salaryAnalyzer) => {
  return new DynamicStructuredTool({
    name: "salary_allocation",
    description: `Calculate optimal salary allocation depending on user's financial profile.
      Splits salary into EMI, rent, SIP, travel, bills, savings, and discretionary spending.
      You MUST pass the salary amount in INR as a number.`,
    schema: z.object({
      salaryAmount: z.number().describe("Monthly salary amount in INR"),
    }),
    func: async ({ salaryAmount }) => {
      try {
        const allocation = await salaryAnalyzer.calculateAllocation(userId, salaryAmount);
        return JSON.stringify(allocation, null, 2);
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
  });
};
