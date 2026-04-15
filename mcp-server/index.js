// ============================================================
// 📡 FRIDAY MCP SERVER
// ============================================================
// Model Context Protocol server that provides financial tools
// to the FRIDAY AI Agent. Can be used with any MCP-compatible
// AI system.
// ============================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "friday-finance-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ──────────────────────────────────────────────
// 📋 List Available Tools
// ──────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_stock_price",
        description: "Get real-time stock price from NSE/BSE with analysis",
        inputSchema: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "NSE stock symbol (e.g., RELIANCE, TCS)" },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_mutual_fund_nav",
        description: "Get latest NAV and returns of a mutual fund",
        inputSchema: {
          type: "object",
          properties: {
            fundName: { type: "string", description: "Mutual fund name or AMFI code" },
          },
          required: ["fundName"],
        },
      },
      {
        name: "screen_stocks",
        description: "Screen stocks based on criteria like P/E ratio, market cap, sector",
        inputSchema: {
          type: "object",
          properties: {
            sector: { type: "string", description: "Sector to filter (IT, Banking, Pharma, etc.)" },
            maxPE: { type: "number", description: "Maximum P/E ratio" },
            minMarketCap: { type: "number", description: "Minimum market cap in Cr" },
          },
        },
      },
      {
        name: "analyze_portfolio_risk",
        description: "Analyze portfolio risk, concentration, and diversification",
        inputSchema: {
          type: "object",
          properties: {
            holdings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
          },
          required: ["holdings"],
        },
      },
      {
        name: "get_top_funds",
        description: "Get top performing mutual funds by category",
        inputSchema: {
          type: "object",
          properties: {
            category: { 
              type: "string", 
              description: "Fund category: large_cap, mid_cap, small_cap, flexi_cap, elss, debt, hybrid" 
            },
            count: { type: "number", description: "Number of funds to return", default: 5 },
          },
          required: ["category"],
        },
      },
    ],
  };
});

// ──────────────────────────────────────────────
// 🔧 Handle Tool Calls
// ──────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_stock_price": {
      const data = await fetchStockPrice(args.symbol);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "get_mutual_fund_nav": {
      const data = await fetchMutualFundNAV(args.fundName);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "screen_stocks": {
      const data = await screenStocks(args);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "analyze_portfolio_risk": {
      const analysis = analyzeRisk(args.holdings);
      return { content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }] };
    }

    case "get_top_funds": {
      const funds = getTopFunds(args.category, args.count || 5);
      return { content: [{ type: "text", text: JSON.stringify(funds, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
});

// ──────────────────────────────────────────────
// 📊 Stock Price Fetcher (Yahoo Finance)
// ──────────────────────────────────────────────
async function fetchStockPrice(symbol) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=1mo`
    );
    const data = await response.json();
    const meta = data.chart.result[0].meta;

    return {
      symbol,
      exchange: "NSE",
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      dayChange: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2) + "%",
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      volume: meta.regularMarketVolume,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { symbol, error: "Unable to fetch stock data", message: error.message };
  }
}

// ──────────────────────────────────────────────
// 📈 Mutual Fund NAV (MFAPI - free)
// ──────────────────────────────────────────────
async function fetchMutualFundNAV(fundName) {
  try {
    // MFAPI.in provides free mutual fund data for Indian funds
    const searchResponse = await fetch(
      `https://api.mfapi.in/mf/search?q=${encodeURIComponent(fundName)}`
    );
    const searchResults = await searchResponse.json();
    
    if (searchResults.length === 0) {
      return { fundName, error: "Fund not found" };
    }

    const fundCode = searchResults[0].schemeCode;
    const navResponse = await fetch(`https://api.mfapi.in/mf/${fundCode}`);
    const navData = await navResponse.json();

    const latestNAV = navData.data[0];
    const oneMonthAgo = navData.data[30] || navData.data[navData.data.length - 1];
    const oneYearAgo = navData.data[365] || navData.data[navData.data.length - 1];

    return {
      fundName: navData.meta.fund_house + " - " + navData.meta.scheme_name,
      schemeCode: fundCode,
      category: navData.meta.scheme_category,
      latestNAV: parseFloat(latestNAV.nav),
      navDate: latestNAV.date,
      returns: {
        oneMonth: oneMonthAgo 
          ? (((latestNAV.nav - oneMonthAgo.nav) / oneMonthAgo.nav) * 100).toFixed(2) + "%"
          : "N/A",
        oneYear: oneYearAgo
          ? (((latestNAV.nav - oneYearAgo.nav) / oneYearAgo.nav) * 100).toFixed(2) + "%"
          : "N/A",
      },
    };
  } catch (error) {
    return { fundName, error: "Unable to fetch fund data", message: error.message };
  }
}

// ──────────────────────────────────────────────
// 🔍 Stock Screener
// ──────────────────────────────────────────────
async function screenStocks({ sector, maxPE, minMarketCap }) {
  // In production, this would call a real stock screener API
  // For now, return curated data
  const allStocks = [
    { symbol: "RELIANCE", sector: "Energy", pe: 28, marketCap: 1800000, name: "Reliance Industries" },
    { symbol: "TCS", sector: "IT", pe: 32, marketCap: 1400000, name: "TCS" },
    { symbol: "HDFCBANK", sector: "Banking", pe: 22, marketCap: 1200000, name: "HDFC Bank" },
    { symbol: "INFY", sector: "IT", pe: 28, marketCap: 700000, name: "Infosys" },
    { symbol: "ICICIBANK", sector: "Banking", pe: 20, marketCap: 800000, name: "ICICI Bank" },
    { symbol: "SBIN", sector: "Banking", pe: 10, marketCap: 700000, name: "SBI" },
    { symbol: "BHARTIARTL", sector: "Telecom", pe: 75, marketCap: 900000, name: "Bharti Airtel" },
    { symbol: "WIPRO", sector: "IT", pe: 24, marketCap: 250000, name: "Wipro" },
    { symbol: "SUNPHARMA", sector: "Pharma", pe: 35, marketCap: 400000, name: "Sun Pharma" },
    { symbol: "DRREDDY", sector: "Pharma", pe: 22, marketCap: 100000, name: "Dr. Reddy's" },
  ];

  let filtered = allStocks;
  if (sector) filtered = filtered.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
  if (maxPE) filtered = filtered.filter(s => s.pe <= maxPE);
  if (minMarketCap) filtered = filtered.filter(s => s.marketCap >= minMarketCap);

  return {
    criteria: { sector, maxPE, minMarketCap },
    results: filtered,
    count: filtered.length,
  };
}

// ──────────────────────────────────────────────
// 📊 Portfolio Risk Analyzer
// ──────────────────────────────────────────────
function analyzeRisk(holdings) {
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  
  // Concentration risk
  const maxHolding = Math.max(...holdings.map(h => h.value));
  const concentrationRisk = maxHolding / totalValue;
  
  // Type diversification
  const types = [...new Set(holdings.map(h => h.type))];
  
  // Risk score (1-10)
  let riskScore = 5;
  if (concentrationRisk > 0.5) riskScore += 2;
  if (types.length <= 1) riskScore += 2;
  if (types.includes("crypto")) riskScore += 1;
  if (types.includes("debt") || types.includes("fd")) riskScore -= 1;
  
  return {
    totalValue,
    holdingsCount: holdings.length,
    diversification: {
      typeCount: types.length,
      types,
      status: types.length >= 4 ? "Good" : types.length >= 2 ? "Fair" : "Poor",
    },
    concentration: {
      maxSingleHolding: ((concentrationRisk * 100).toFixed(1)) + "%",
      risk: concentrationRisk > 0.4 ? "HIGH" : concentrationRisk > 0.25 ? "MODERATE" : "LOW",
    },
    overallRiskScore: Math.min(10, Math.max(1, riskScore)),
    recommendations: [
      concentrationRisk > 0.4 && "Reduce concentration — no single holding should be >40%",
      types.length < 3 && "Add more asset classes for better diversification",
      !types.includes("debt") && "Consider adding debt instruments for stability",
      !types.includes("gold") && "Consider 5-10% gold allocation as hedge",
    ].filter(Boolean),
  };
}

// ──────────────────────────────────────────────
// 🏆 Top Funds by Category
// ──────────────────────────────────────────────
function getTopFunds(category, count = 5) {
  const fundDatabase = {
    large_cap: [
      { name: "Mirae Asset Large Cap Fund", return1Y: "18.5%", return3Y: "14.2%", rating: 5 },
      { name: "Axis Bluechip Fund", return1Y: "16.8%", return3Y: "13.5%", rating: 5 },
      { name: "ICICI Prudential Bluechip Fund", return1Y: "17.2%", return3Y: "14.8%", rating: 4 },
      { name: "SBI Blue Chip Fund", return1Y: "15.9%", return3Y: "13.1%", rating: 4 },
      { name: "Kotak Bluechip Fund", return1Y: "16.1%", return3Y: "13.8%", rating: 4 },
    ],
    mid_cap: [
      { name: "Axis Midcap Fund", return1Y: "22.4%", return3Y: "17.8%", rating: 5 },
      { name: "Kotak Emerging Equity Fund", return1Y: "24.1%", return3Y: "18.5%", rating: 5 },
      { name: "HDFC Mid-Cap Opportunities Fund", return1Y: "21.8%", return3Y: "16.9%", rating: 4 },
      { name: "DSP Midcap Fund", return1Y: "20.5%", return3Y: "16.2%", rating: 4 },
      { name: "Motilal Oswal Midcap Fund", return1Y: "25.2%", return3Y: "19.1%", rating: 5 },
    ],
    small_cap: [
      { name: "Quant Small Cap Fund", return1Y: "32.5%", return3Y: "28.4%", rating: 5 },
      { name: "Nippon India Small Cap Fund", return1Y: "28.9%", return3Y: "24.6%", rating: 5 },
      { name: "Axis Small Cap Fund", return1Y: "26.3%", return3Y: "22.1%", rating: 4 },
      { name: "SBI Small Cap Fund", return1Y: "24.8%", return3Y: "21.5%", rating: 4 },
      { name: "HDFC Small Cap Fund", return1Y: "23.5%", return3Y: "20.2%", rating: 4 },
    ],
    elss: [
      { name: "Mirae Asset Tax Saver Fund", return1Y: "19.2%", return3Y: "15.8%", lockIn: "3 years", rating: 5 },
      { name: "Axis Long Term Equity Fund", return1Y: "17.5%", return3Y: "14.2%", lockIn: "3 years", rating: 5 },
      { name: "Quant Tax Plan", return1Y: "28.3%", return3Y: "22.4%", lockIn: "3 years", rating: 5 },
      { name: "Parag Parikh Tax Saver Fund", return1Y: "20.1%", return3Y: "16.5%", lockIn: "3 years", rating: 4 },
      { name: "DSP Tax Saver Fund", return1Y: "18.7%", return3Y: "15.1%", lockIn: "3 years", rating: 4 },
    ],
    flexi_cap: [
      { name: "Parag Parikh Flexi Cap Fund", return1Y: "20.8%", return3Y: "16.9%", rating: 5 },
      { name: "PPFAS Flexi Cap Fund", return1Y: "19.5%", return3Y: "15.8%", rating: 5 },
      { name: "HDFC Flexi Cap Fund", return1Y: "18.2%", return3Y: "14.5%", rating: 4 },
      { name: "Kotak Flexicap Fund", return1Y: "17.8%", return3Y: "14.1%", rating: 4 },
      { name: "UTI Flexi Cap Fund", return1Y: "16.9%", return3Y: "13.5%", rating: 4 },
    ],
    debt: [
      { name: "HDFC Short Term Debt Fund", return1Y: "7.8%", return3Y: "7.2%", risk: "Low", rating: 5 },
      { name: "ICICI Prudential Short Term Fund", return1Y: "7.5%", return3Y: "7.0%", risk: "Low", rating: 4 },
      { name: "Axis Banking & PSU Debt Fund", return1Y: "7.2%", return3Y: "6.8%", risk: "Low", rating: 4 },
    ],
    hybrid: [
      { name: "HDFC Balanced Advantage Fund", return1Y: "14.5%", return3Y: "11.8%", risk: "Moderate", rating: 5 },
      { name: "ICICI Prudential Equity & Debt Fund", return1Y: "15.2%", return3Y: "12.5%", risk: "Moderate", rating: 5 },
      { name: "Kotak Equity Hybrid Fund", return1Y: "13.8%", return3Y: "11.2%", risk: "Moderate", rating: 4 },
    ],
  };

  const funds = fundDatabase[category] || [];
  return {
    category,
    funds: funds.slice(0, count),
    count: Math.min(count, funds.length),
    disclaimer: "Past returns do not guarantee future performance",
  };
}

// ──────────────────────────────────────────────
// 🚀 Start MCP Server
// ──────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🤖 FRIDAY Finance MCP Server running on stdio");
}

main().catch(console.error);