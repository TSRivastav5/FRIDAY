/**
 * MCPService - Model Context Protocol Integration
 * Handles integration with MCP servers (e.g., "Grow" for investment insights)
 * Currently mocked; real MCP server integration comes later
 */

class MCPService {
  constructor() {
    this.mcpEndpoint = import.meta.env.VITE_MCP_ENDPOINT;
    this.growApiKey = import.meta.env.VITE_GROW_MCP_KEY;
    this.isConnected = !!(this.mcpEndpoint && this.growApiKey);
  }

  /**
   * Query Grow MCP for investment portfolio insights
   * Grow typically provides: fund recommendations, rebalancing suggestions, tax optimization
   */
  async queryGrowPortfolio(investments = []) {
    if (this.isConnected) {
      return this.queryRealGrow(investments);
    }

    // Mock response
    return this.getMockGrowInsight(investments);
  }

  /**
   * Real MCP/Grow API call (when configured)
   */
  async queryRealGrow(investments) {
    try {
      const portfolioData = {
        holdings: investments.map((inv) => ({
          name: inv.name,
          type: inv.type,
          invested: inv.invested,
          currentValue: inv.currentValue || inv.invested,
        })),
        totalInvested: investments.reduce((sum, inv) => sum + inv.invested, 0),
      };

      const response = await fetch(`${this.mcpEndpoint}/grow/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.growApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        throw new Error(`MCP/Grow API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MCP/Grow connection error:', error);
      return this.getMockGrowInsight(investments);
    }
  }

  /**
   * Mock Grow insights (used when MCP not connected)
   */
  getMockGrowInsight(investments) {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.invested), 0);
    const gains = totalValue - totalInvested;
    const gainPercentage = totalInvested > 0 ? ((gains / totalInvested) * 100).toFixed(1) : 0;

    // Find best performing investment type
    const byType = {};
    investments.forEach((inv) => {
      if (!byType[inv.type]) byType[inv.type] = [];
      byType[inv.type].push(inv);
    });

    const typePerformance = Object.entries(byType).map(([type, items]) => {
      const typeInvested = items.reduce((sum, inv) => sum + inv.invested, 0);
      const typeValue = items.reduce((sum, inv) => sum + (inv.currentValue || inv.invested), 0);
      const typeGain = ((typeValue - typeInvested) / typeInvested) * 100;
      return { type, gain: typeGain };
    });

    const bestType = typePerformance.sort((a, b) => b.gain - a.gain)[0];

    const mockInsights = [
      {
        recommendation: `Your ${bestType.type} is up ${bestType.gain.toFixed(1)}% this year — consider topping up by ₹2,000`,
        action: 'topup',
        suggestedAmount: 2000,
        confidence: 0.85,
      },
      {
        recommendation: `Portfolio growth at ${gainPercentage}% YTD. Rebalance by moving 5% from bonds to equities.`,
        action: 'rebalance',
        confidence: 0.78,
      },
      {
        recommendation: `Your high-dividend MF is ideal for tax savings. Increase allocation by ₹1,500/month.`,
        action: 'taxOptimize',
        suggestedAmount: 1500,
        confidence: 0.82,
      },
    ];

    return mockInsights[Math.floor(Math.random() * mockInsights.length)];
  }

  /**
   * Send portfolio snapshot to Grow for analysis
   * MCP servers often need complete context for better recommendations
   */
  async sendPortfolioSnapshot(portfolio) {
    const snapshot = {
      timestamp: new Date().toISOString(),
      totalInvested: portfolio.totalInvested,
      currentValue: portfolio.currentValue,
      monthlyInvestment: portfolio.monthlyInvestment,
      investmentHorizon: portfolio.horizon || '15+ years',
      riskProfile: portfolio.riskProfile || 'Moderate',
      goals: portfolio.goals || ['Wealth accumulation', 'Tax optimization'],
      holdings: portfolio.investments,
    };

    if (this.isConnected) {
      try {
        await fetch(`${this.mcpEndpoint}/grow/snapshot`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.growApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(snapshot),
        });
      } catch (error) {
        console.warn('Could not send portfolio snapshot to MCP/Grow:', error);
      }
    }

    return snapshot;
  }

  /**
   * Get MCP connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      endpoint: this.mcpEndpoint ? '✅ Configured' : '❌ Not configured',
      service: 'Grow MCP (Investment Analysis)',
    };
  }
}

export const mcpService = new MCPService();
