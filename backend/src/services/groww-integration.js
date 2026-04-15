// ============================================================
// 📈 GROWW INTEGRATION SERVICE
// ============================================================
// This connects to Groww's API (or MCP server) to fetch
// real portfolio data, SIP details, and mutual fund info.
// ============================================================

import Investment from "../models/Investment.js";

export class GrowwIntegration {
  constructor() {
    this.mcpEndpoint = process.env.MCP_ENDPOINT || null;
    this.growwApiKey = process.env.GROWW_API_KEY || null;
    this.isConfigured = !!(this.mcpEndpoint || this.growwApiKey);
  }

  // ──────────────────────────────────────────────
  // 🔌 Main Query Method
  // ──────────────────────────────────────────────
  async query(userId, action, params = {}) {
    // If Groww API/MCP is configured, use real data
    if (this.isConfigured) {
      return await this._queryReal(userId, action, params);
    }
    
    // Otherwise, use local database
    return await this._queryLocal(userId, action, params);
  }

  // ──────────────────────────────────────────────
  // 📊 Query Local Database (Fallback)
  // ──────────────────────────────────────────────
  async _queryLocal(userId, action, params) {
    switch (action) {
      case "get_holdings":
        const holdings = await Investment.find({ userId, isActive: true });
        return {
          source: "local_database",
          holdings: holdings.map(h => ({
            name: h.name,
            type: h.type,
            invested: h.investedAmount,
            currentValue: h.currentValue,
            returns: h.returns,
            platform: h.platform,
          })),
          totalInvested: holdings.reduce((s, h) => s + h.investedAmount, 0),
          totalCurrent: holdings.reduce((s, h) => s + h.currentValue, 0),
        };

      case "get_sips":
        const sips = await Investment.find({ userId, type: "sip", isActive: true });
        return {
          source: "local_database",
          sips: sips.map(s => ({
            name: s.name,
            monthlyAmount: s.sipDetails?.monthlyAmount,
            nextDate: s.sipDetails?.nextDate,
            totalInvested: s.investedAmount,
            currentValue: s.currentValue,
          })),
          totalMonthlySIP: sips.reduce((sum, s) => sum + (s.sipDetails?.monthlyAmount || 0), 0),
        };

      case "get_returns":
        const allInvestments = await Investment.find({ userId, isActive: true });
        const totalInvested = allInvestments.reduce((s, i) => s + i.investedAmount, 0);
        const totalCurrent = allInvestments.reduce((s, i) => s + i.currentValue, 0);
        return {
          source: "local_database",
          totalInvested,
          totalCurrent,
          absoluteReturn: totalCurrent - totalInvested,
          percentageReturn: totalInvested > 0 
            ? (((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(2) + "%"
            : "0%",
        };

      case "fund_performance":
        if (params.fundName) {
          const fund = await Investment.findOne({ 
            userId, 
            name: { $regex: params.fundName, $options: "i" } 
          });
          return fund || { message: `Fund "${params.fundName}" not found in your portfolio` };
        }
        return { message: "Please specify a fund name" };

      case "portfolio_summary":
        const summary = await Investment.aggregate([
          { $match: { userId, isActive: true } },
          {
            $group: {
              _id: "$type",
              totalInvested: { $sum: "$investedAmount" },
              currentValue: { $sum: "$currentValue" },
              count: { $sum: 1 },
            },
          },
        ]);
        return { source: "local_database", summary };

      default:
        return { error: `Unknown action: ${action}` };
    }
  }

  // ──────────────────────────────────────────────
  // 🌐 Query Real Groww API / MCP (When Configured)
  // ──────────────────────────────────────────────
  async _queryReal(userId, action, params) {
    try {
      const endpoint = this.mcpEndpoint || "https://groww.in/api";
      
      const response = await fetch(`${endpoint}/portfolio/${action}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.growwApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, ...params }),
      });

      if (!response.ok) {
        console.warn(`Groww API error: ${response.status}, falling back to local`);
        return await this._queryLocal(userId, action, params);
      }

      return await response.json();
    } catch (error) {
      console.warn("Groww API unavailable, using local data:", error.message);
      return await this._queryLocal(userId, action, params);
    }
  }
}