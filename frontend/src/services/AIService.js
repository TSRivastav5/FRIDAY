/**
 * AIService - Azure OpenAI Integration
 * Handles salary calculations, investment insights, and financial recommendations
 */

class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    this.deploymentId = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;
    this.isConfigured = !!(this.apiKey && this.endpoint && this.deploymentId);
  }

  /**
   * Generate automatic salary allocation based on income
   * Calculates EMI, Rent, SIP, Travel, Bills, Remaining
   */
  calculateSalaryAllocation(salaryAmount) {
    // Default allocation percentages
    const allocation = {
      emi: Math.round(salaryAmount * 0.21), // 21% for EMI
      rent: Math.round(salaryAmount * 0.14), // 14% for Rent
      sip: Math.round(salaryAmount * 0.12), // 12% for SIP (auto-invest)
      travel: Math.round(salaryAmount * 0.07), // 7% for Travel
      bills: Math.round(salaryAmount * 0.04), // 4% for Bills/Utilities
    };

    // Calculate remaining
    allocation.remaining = salaryAmount - (allocation.emi + allocation.rent + allocation.sip + allocation.travel + allocation.bills);

    return allocation;
  }

  /**
   * Get personalized salary allocation advice from Azure OpenAI
   * Used when AI is configured; otherwise returns default percentages
   */
  async getSalaryAdvice(salaryAmount, userProfile = {}) {
    if (!this.isConfigured) {
      console.warn('Azure OpenAI not configured. Using default allocation.');
      return this.getDefaultAdvice(salaryAmount);
    }

    try {
      const prompt = `You are a financial advisor. Analyze this salary and provide allocation advice:
        
Salary: ₹${salaryAmount.toLocaleString('en-IN')}
User Location: ${userProfile.location || 'Metropolitan India'}
Current Expenses: ₹${userProfile.monthlyExpense || 'Unknown'}
Existing Investments: ₹${userProfile.investmentAmount || 'None'}

Provide a realistic allocation breakdown in JSON format with these fields:
{
  "analysis": "Brief 1-2 sentence analysis",
  "emi": number (monthly EMI/loan payment estimate),
  "rent": number (reasonable rent for location),
  "sip": number (monthly SIP investment for retirement),
  "travel": number (commute + occasional travel),
  "bills": number (utilities, internet, phone),
  "remaining": number (discretionary spending)
}

Keep percentages realistic for India: EMI ~18-24%, Rent ~12-18%, SIP ~10-15%, Travel ~5-8%, Bills ~3-5%`;

      const response = await fetch(`${this.endpoint}/openai/deployments/${this.deploymentId}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getDefaultAdvice(salaryAmount);
    } catch (error) {
      console.error('Azure OpenAI error:', error);
      // Fallback to default allocation
      return this.getDefaultAdvice(salaryAmount);
    }
  }

  /**
   * Get investment growth insights from Claude (mock for now, real MCP later)
   * Checks portfolio performance and suggests optimization
   */
  async getInvestmentInsight(investments = [], currentValue = 0) {
    if (!this.isConfigured) {
      return this.getDefaultInvestmentInsight();
    }

    try {
      const investmentSummary = investments
        .map((inv) => `${inv.name} (${inv.type}): ₹${inv.invested} → ₹${inv.currentValue || inv.invested}`)
        .join('\n');

      const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
      const gains = currentValue - totalInvested;
      const gainPercentage = totalInvested > 0 ? ((gains / totalInvested) * 100).toFixed(2) : 0;

      const prompt = `You are a financial advisor analyzing this investment portfolio:

${investmentSummary}

Total Invested: ₹${totalInvested.toLocaleString('en-IN')}
Current Value: ₹${currentValue.toLocaleString('en-IN')}
Gains: ₹${gains.toLocaleString('en-IN')} (${gainPercentage}%)

Provide ONE specific, actionable investment recommendation in 1-2 sentences. Focus on either:
1. Topping up an underperforming asset
2. Rebalancing the portfolio
3. Starting a new investment type
4. Tax optimization opportunity

Keep it concise and actionable.`;

      const response = await fetch(`${this.endpoint}/openai/deployments/${this.deploymentId}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        insight: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
        source: 'Azure OpenAI',
      };
    } catch (error) {
      console.error('Investment insight error:', error);
      return this.getDefaultInvestmentInsight();
    }
  }

  /**
   * Spending analysis - identify trends and optimization opportunities
   */
  async analyzeSpending(expenses = [], categoryTotals = {}) {
    if (!this.isConfigured) {
      return this.getDefaultSpendingAnalysis(expenses, categoryTotals);
    }

    try {
      const topCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat, amount]) => `${cat}: ₹${amount}`)
        .join(', ');

      const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

      const prompt = `As a financial advisor, analyze this spending pattern:

Top Categories: ${topCategories}
Total Monthly: ₹${totalExpense.toLocaleString('en-IN')}
Transaction Count: ${expenses.length}

Provide ONE spending optimization tip in 1-2 sentences. Be specific and actionable. 
Focus on either: cost reduction, discretionary spending, or category reallocation.`;

      const response = await fetch(`${this.endpoint}/openai/deployments/${this.deploymentId}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Spending analysis error:', error);
      return this.getDefaultSpendingAnalysis(expenses, categoryTotals);
    }
  }

  // ===== Fallback/Default Methods =====

  getDefaultAdvice(salaryAmount) {
    return {
      analysis: 'Default allocation based on industry best practices for Indian markets.',
      ...this.calculateSalaryAllocation(salaryAmount),
    };
  }

  getDefaultInvestmentInsight() {
    const insights = [
      'Your ELSS is up 14% this year — consider topping up by ₹2,000 for tax benefits.',
      'Recent market dip presents opportunity to increase SIP by ₹500-₹1,000.',
      'Cash allocation is healthy at 15%. Consider shifting ₹5,000 to growth funds.',
      'Your portfolio is well-diversified. Consider rebalancing quarterly.',
      'Mutual funds showing strong returns. Lock in gains by increasing equity SIP.',
    ];
    return {
      insight: insights[Math.floor(Math.random() * insights.length)],
      timestamp: new Date().toISOString(),
      source: 'Default Advisor',
    };
  }

  getDefaultSpendingAnalysis(expenses, categoryTotals) {
    const tips = [
      'Travel costs are trending up 8%. Consider carpooling or public transit.',
      'Food spending is 28% of budget. Meal planning could save ₹2,000-₹3,000.',
      'Entertainment category shows room for optimization. Set a monthly cap of ₹3,000.',
      'Subscriptions might be costing you ₹1,500+/month. Audit and cancel unused ones.',
      'Shopping category needs attention — try the 30-day rule before purchases.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  /**
   * Request push notification permission
   */
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

export const aiService = new AIService();
