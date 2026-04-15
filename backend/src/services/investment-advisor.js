import Investment from "../models/Investment.js";

export class InvestmentAdvisor {
  
  // ──────────────────────────────────────────────
  // 📈 Get Investment Recommendations
  // ──────────────────────────────────────────────
  async getRecommendations(userId, budget, options = {}) {
    const { riskProfile = "moderate", investmentGoal, timeHorizon } = options;
    
    // Fetch existing portfolio
    const existingInvestments = await Investment.find({ userId, isActive: true });
    
    // Calculate current portfolio composition
    const portfolio = this._analyzeComposition(existingInvestments);
    
    // Ideal allocation based on risk profile
    const idealAllocation = this._getIdealAllocation(riskProfile);
    
    // Generate recommendations
    const recommendations = [];
    
    // 1. Check if emergency fund is priority
    // (Handled by salary analyzer)

    // 2. Tax saving recommendations (if budget allows)
    const taxSaving = this._getTaxSavingRecommendations(budget, existingInvestments);
    if (taxSaving.length > 0) {
      recommendations.push(...taxSaving);
    }

    // 3. SIP recommendations
    const sipBudget = Math.round(budget * idealAllocation.equity * 0.6);
    if (sipBudget >= 500) {
      recommendations.push({
        type: "sip",
        category: "equity_mutual_fund",
        suggestions: this._getTopFunds(riskProfile, sipBudget),
        amount: sipBudget,
        reason: "SIP provides rupee-cost averaging and disciplined investing",
      });
    }

    // 4. Direct equity recommendations
    const equityBudget = Math.round(budget * idealAllocation.equity * 0.4);
    if (equityBudget >= 1000) {
      recommendations.push({
        type: "stocks",
        category: "direct_equity",
        suggestions: this._getStockPicks(riskProfile),
        amount: equityBudget,
        reason: "Direct equity for higher returns (higher risk)",
      });
    }

    // 5. Debt allocation
    const debtBudget = Math.round(budget * idealAllocation.debt);
    if (debtBudget >= 500) {
      recommendations.push({
        type: "debt",
        category: "debt_funds",
        suggestions: [
          { name: "HDFC Short Term Debt Fund", returnExpected: "7-8%", risk: "Low" },
          { name: "ICICI Prudential Corporate Bond Fund", returnExpected: "7-8.5%", risk: "Low" },
        ],
        amount: debtBudget,
        reason: "Debt allocation for stability and predictable returns",
      });
    }

    // 6. Gold allocation
    const goldBudget = Math.round(budget * idealAllocation.gold);
    if (goldBudget >= 500) {
      recommendations.push({
        type: "gold",
        category: "gold_etf",
        suggestions: [
          { name: "Nippon India Gold ETF", returnExpected: "8-12%", risk: "Moderate" },
          { name: "SBI Gold Fund", returnExpected: "8-11%", risk: "Moderate" },
        ],
        amount: goldBudget,
        reason: "Gold as hedge against inflation and market downturns",
      });
    }

    return {
      budget,
      riskProfile,
      currentPortfolio: portfolio,
      idealAllocation,
      recommendations,
      totalRecommended: recommendations.reduce((s, r) => s + r.amount, 0),
      disclaimer: "These are suggestions, not guaranteed returns. Please do your own research.",
    };
  }

  // ──────────────────────────────────────────────
  // 🔍 Full Portfolio Analysis
  // ──────────────────────────────────────────────
  async analyzePortfolio(investments, analysisType) {
    const portfolio = this._analyzeComposition(investments);
    
    switch (analysisType) {
      case "full_analysis":
        return {
          composition: portfolio,
          diversification: this._checkDiversification(portfolio),
          topPerformers: investments
            .filter(i => i.returns.percentage > 0)
            .sort((a, b) => b.returns.percentage - a.returns.percentage)
            .slice(0, 5)
            .map(i => ({
              name: i.name,
              type: i.type,
              returns: `${i.returns.percentage}%`,
              value: i.currentValue,
            })),
          underPerformers: investments
            .filter(i => i.returns.percentage < 5) // Below FD rate
            .map(i => ({
              name: i.name,
              type: i.type,
              returns: `${i.returns.percentage}%`,
              action: i.returns.percentage < 0 ? "Consider selling" : "Monitor closely",
            })),
          overallReturns: {
            totalInvested: investments.reduce((s, i) => s + i.investedAmount, 0),
            currentValue: investments.reduce((s, i) => s + i.currentValue, 0),
          },
        };

      case "sell_recommendations":
        return investments
          .filter(i => {
            // Sell if: negative returns for > 1 year, or > 50% gain (book profit)
            const holdingDays = (Date.now() - new Date(i.createdAt)) / (1000 * 60 * 60 * 24);
            return (
              (i.returns.percentage < -10 && holdingDays > 365) ||
              (i.returns.percentage > 50) ||
              (i.returns.percentage < 0 && holdingDays > 180)
            );
          })
          .map(i => ({
            name: i.name,
            type: i.type,
            invested: i.investedAmount,
            current: i.currentValue,
            returns: `${i.returns.percentage}%`,
            reason: i.returns.percentage > 50 
              ? "Book profits — excellent returns" 
              : "Underperforming — cut losses",
          }));

      case "tax_harvesting":
        return investments
          .filter(i => i.returns.absolute < 0)
          .map(i => ({
            name: i.name,
            loss: Math.abs(i.returns.absolute),
            suggestion: "Sell to book loss, offset against capital gains",
          }));

      default:
        return { message: "Unknown analysis type" };
    }
  }

  // ──────────────────────────────────────────────
  // 🔧 Helper Methods
  // ──────────────────────────────────────────────
  _analyzeComposition(investments) {
    const total = investments.reduce((s, i) => s + i.currentValue, 0);
    const byType = {};
    
    investments.forEach(inv => {
      if (!byType[inv.type]) byType[inv.type] = 0;
      byType[inv.type] += inv.currentValue;
    });

    return Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [
        k, 
        { value: v, percent: total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0%" }
      ])
    );
  }

  _getIdealAllocation(riskProfile) {
    const allocations = {
      conservative: { equity: 0.30, debt: 0.50, gold: 0.10, cash: 0.10 },
      moderate:     { equity: 0.60, debt: 0.25, gold: 0.10, cash: 0.05 },
      aggressive:   { equity: 0.80, debt: 0.10, gold: 0.05, cash: 0.05 },
    };
    return allocations[riskProfile] || allocations.moderate;
  }

  _getTopFunds(riskProfile, budget) {
    const funds = {
      conservative: [
        { name: "HDFC Balanced Advantage Fund", type: "Hybrid", returnExpected: "10-12%", minSIP: 500 },
        { name: "ICICI Prudential Equity & Debt Fund", type: "Hybrid", returnExpected: "11-13%", minSIP: 100 },
      ],
      moderate: [
        { name: "Parag Parikh Flexi Cap Fund", type: "Flexi Cap", returnExpected: "14-16%", minSIP: 1000 },
        { name: "Mirae Asset Large Cap Fund", type: "Large Cap", returnExpected: "12-15%", minSIP: 500 },
        { name: "Axis Midcap Fund", type: "Mid Cap", returnExpected: "15-18%", minSIP: 500 },
      ],
      aggressive: [
        { name: "Quant Small Cap Fund", type: "Small Cap", returnExpected: "18-22%", minSIP: 1000 },
        { name: "Nippon India Small Cap Fund", type: "Small Cap", returnExpected: "16-20%", minSIP: 500 },
        { name: "Motilal Oswal Midcap Fund", type: "Mid Cap", returnExpected: "16-19%", minSIP: 500 },
      ],
    };
    return funds[riskProfile] || funds.moderate;
  }

  _getStockPicks(riskProfile) {
    // This would ideally come from a real stock screener API
    return [
      { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy/Tech", reason: "Strong fundamentals, digital growth" },
      { symbol: "TCS", name: "Tata Consultancy", sector: "IT", reason: "Consistent performer, strong order book" },
      { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", reason: "Best-in-class banking stock" },
      { symbol: "INFY", name: "Infosys", sector: "IT", reason: "Digital transformation leader" },
    ];
  }

  _getTaxSavingRecommendations(budget, investments) {
    const elssInvested = investments
      .filter(i => i.tags?.includes("tax_saving"))
      .reduce((s, i) => s + i.investedAmount, 0);
    
    const remaining80C = Math.max(0, 150000 - elssInvested);
    
    if (remaining80C > 0 && budget >= 500) {
      const elssAmount = Math.min(remaining80C / 12, budget * 0.2); // 20% of budget or remaining 80C
      return [{
        type: "elss",
        category: "tax_saving",
        suggestions: [
          { name: "Mirae Asset Tax Saver Fund", returnExpected: "14-16%", lockIn: "3 years" },
          { name: "Axis Long Term Equity Fund", returnExpected: "12-15%", lockIn: "3 years" },
        ],
        amount: Math.round(elssAmount),
        reason: `You have ₹${remaining80C.toLocaleString('en-IN')} remaining under Section 80C. ELSS gives best returns among 80C options.`,
      }];
    }
    return [];
  }

  _checkDiversification(portfolio) {
    const types = Object.keys(portfolio);
    if (types.length <= 1) return "⚠️ POOR — All eggs in one basket!";
    if (types.length <= 2) return "⚡ FAIR — Needs more diversification";
    if (types.length >= 4) return "✅ GOOD — Well diversified";
    return "👍 OKAY — Consider adding more asset classes";
  }
}