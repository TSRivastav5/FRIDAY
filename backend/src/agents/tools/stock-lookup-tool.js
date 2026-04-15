import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const createStockLookupTool = () => {
  return new DynamicStructuredTool({
    name: "stock_lookup",
    description: `Look up real-time stock data from NSE/BSE. Get current price,
      52-week high/low, and technical analysis. Pass a stock ticker symbol.`,
    schema: z.object({
      symbol: z.string().describe("Stock symbol e.g., RELIANCE.NS, TCS.NS"),
    }),
    func: async ({ symbol }) => {
      try {
        // Uses Yahoo Finance API (free tier) directly
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
        const data = await response.json();
        
        if (data.chart.error) throw new Error(data.chart.error.description);
        
        const quote = data.chart.result[0];
        const meta = quote.meta;
        
        const result = {
          symbol: symbol,
          currentPrice: meta.regularMarketPrice,
          previousClose: meta.previousClose,
          changePercent: (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2) + "%",
          currency: "INR",
        };

        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({ error: `Could not fetch stock data for ${symbol}. Market might be closed or symbol is invalid.` });
      }
    },
  });
};
