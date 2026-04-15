// ============================================================
// 📈 Stock Service — 100% FREE (Yahoo Finance + Google Finance)
// ============================================================
// No API key needed! Uses public Yahoo Finance endpoints.
// ============================================================

export class StockService {
  constructor() {
    // Popular Indian stocks to track
    this.watchlist = [
      "RELIANCE.NS",
      "TCS.NS",
      "HDFCBANK.NS",
      "INFY.NS",
      "ICICIBANK.NS",
      "SBIN.NS",
      "BHARTIARTL.NS",
      "ITC.NS",
      "KOTAKBANK.NS",
      "LT.NS",
    ];
  }

  // ──────────────────────────────────────────
  // 📊 Get Single Stock Price (FREE)
  // ──────────────────────────────────────────
  async getStockPrice(symbol) {
    try {
      // Yahoo Finance public API — no key needed
      const nseSymbol = symbol.includes(".NS") ? symbol : `${symbol}.NS`;

      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}?interval=1d&range=5d`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance error: ${response.status}`);
      }

      const data = await response.json();
      const meta = data.chart.result[0].meta;

      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = (
        ((currentPrice - previousClose) / previousClose) *
        100
      ).toFixed(2);

      return {
        symbol: symbol.replace(".NS", ""),
        exchange: "NSE",
        currentPrice,
        previousClose,
        dayChange: `${change >= 0 ? "+" : ""}${change}%`,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        isNearLow:
          currentPrice <= meta.fiftyTwoWeekLow * 1.1
            ? "🟢 Near 52-week low — potential buy"
            : null,
        isNearHigh:
          currentPrice >= meta.fiftyTwoWeekHigh * 0.95
            ? "🟡 Near 52-week high — consider booking profits"
            : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`Failed to fetch ${symbol}:`, error.message);
      return {
        symbol: symbol.replace(".NS", ""),
        error: "Price unavailable",
        message: error.message,
      };
    }
  }

  // ──────────────────────────────────────────
  // 📊 Quick Market Insights (FREE)
  // ──────────────────────────────────────────
  async getQuickInsights() {
    const keyStocks = [
      "RELIANCE.NS",
      "TCS.NS",
      "HDFCBANK.NS",
      "NIFTY_50.NS",
    ];
    const results = [];

    for (const symbol of keyStocks) {
      try {
        const data = await this.getStockPrice(symbol);
        if (!data.error) results.push(data);
      } catch (e) {
        // Skip failed ones
      }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    return {
      marketOverview: results,
      timestamp: new Date().toISOString(),
      source: "Yahoo Finance (free)",
    };
  }

  // ──────────────────────────────────────────
  // 🔍 Check if stock is good to buy
  // ──────────────────────────────────────────
  async shouldBuy(symbol) {
    const data = await this.getStockPrice(symbol);
    if (data.error) return data;

    const price = data.currentPrice;
    const low = data.fiftyTwoWeekLow;
    const high = data.fiftyTwoWeekHigh;
    const range = high - low;
    const position = ((price - low) / range) * 100;

    let recommendation;
    if (position <= 20) {
      recommendation = {
        action: "STRONG BUY",
        reason: "Stock is near 52-week low — great value entry point",
      };
    } else if (position <= 40) {
      recommendation = {
        action: "BUY",
        reason: "Stock is in lower range — good time to accumulate",
      };
    } else if (position <= 60) {
      recommendation = {
        action: "HOLD",
        reason: "Stock is in mid-range — wait for dip or hold existing",
      };
    } else if (position <= 80) {
      recommendation = {
        action: "PARTIAL SELL",
        reason:
          "Stock is in upper range — consider booking partial profits",
      };
    } else {
      recommendation = {
        action: "SELL / AVOID",
        reason:
          "Stock is near 52-week high — risky to buy, consider selling",
      };
    }

    return {
      ...data,
      rangePosition: `${position.toFixed(0)}%`,
      recommendation,
    };
  }
}