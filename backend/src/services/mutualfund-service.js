// ============================================================
// 📈 Mutual Fund Service — 100% FREE (MFAPI.in)
// ============================================================
// MFAPI.in is completely free, no API key needed!
// It has NAV data for ALL Indian mutual funds.
// ============================================================

export class MutualFundService {
  constructor() {
    this.baseUrl = "https://api.mfapi.in/mf";

    // Popular fund codes (AMFI codes)
    this.popularFunds = {
      // Flexi Cap
      "Parag Parikh Flexi Cap": 122639,
      "HDFC Flexi Cap": 118989,
      "Kotak Flexicap": 112091,

      // Large Cap
      "Mirae Asset Large Cap": 118834,
      "Axis Bluechip": 120503,
      "SBI Blue Chip": 119598,

      // Mid Cap
      "Axis Midcap": 120505,
      "Kotak Emerging Equity": 112090,
      "HDFC Mid Cap Opportunities": 118988,

      // Small Cap
      "Quant Small Cap": 120828,
      "Nippon India Small Cap": 118778,
      "SBI Small Cap": 119600,

      // ELSS (Tax Saving)
      "Mirae Asset Tax Saver": 118835,
      "Axis Long Term Equity": 120503,
      "Quant Tax Plan": 120823,

      // Index Funds
      "UTI Nifty 50 Index": 120716,
      "HDFC Index Nifty 50": 118984,

      // Debt
      "HDFC Short Term Debt": 118986,
      "ICICI Prudential Short Term": 120197,
    };
  }

  // ──────────────────────────────────────────
  // 📊 Get Fund NAV & Returns (FREE)
  // ──────────────────────────────────────────
  async getFundData(schemeCode) {
    try {
      const response = await fetch(`${this.baseUrl}/${schemeCode}`);
      if (!response.ok)
        throw new Error(`MFAPI error: ${response.status}`);
      const data = await response.json();

      const navData = data.data; // Array of { date, nav }
      const latest = navData[0];

      // Calculate returns
      const returns = {};
      const latestNav = parseFloat(latest.nav);

      // 1 Month
      if (navData.length > 22) {
        const oneMonthNav = parseFloat(navData[22].nav);
        returns.oneMonth =
          (((latestNav - oneMonthNav) / oneMonthNav) * 100).toFixed(2) +
          "%";
      }

      // 3 Months
      if (navData.length > 66) {
        const threeMonthNav = parseFloat(navData[66].nav);
        returns.threeMonths =
          (
            ((latestNav - threeMonthNav) / threeMonthNav) *
            100
          ).toFixed(2) + "%";
      }

      // 6 Months
      if (navData.length > 132) {
        const sixMonthNav = parseFloat(navData[132].nav);
        returns.sixMonths =
          (((latestNav - sixMonthNav) / sixMonthNav) * 100).toFixed(2) +
          "%";
      }

      // 1 Year
      if (navData.length > 252) {
        const oneYearNav = parseFloat(navData[252].nav);
        returns.oneYear =
          (((latestNav - oneYearNav) / oneYearNav) * 100).toFixed(2) +
          "%";
      }

      return {
        fundName: data.meta.fund_house + " - " + data.meta.scheme_name,
        schemeCode: data.meta.scheme_code,
        category: data.meta.scheme_category,
        type: data.meta.scheme_type,
        latestNAV: latestNav,
        navDate: latest.date,
        returns,
        source: "MFAPI.in (free)",
      };
    } catch (error) {
      return {
        schemeCode,
        error: "Fund data unavailable",
        message: error.message,
      };
    }
  }

  // ──────────────────────────────────────────
  // 🏆 Get Top Performers by Category (FREE)
  // ──────────────────────────────────────────
  async getTopPerformers(category, count = 5) {
    const categoryFunds = {
      flexi_cap: [
        "Parag Parikh Flexi Cap",
        "HDFC Flexi Cap",
        "Kotak Flexicap",
      ],
      large_cap: [
        "Mirae Asset Large Cap",
        "Axis Bluechip",
        "SBI Blue Chip",
      ],
      mid_cap: [
        "Axis Midcap",
        "Kotak Emerging Equity",
        "HDFC Mid Cap Opportunities",
      ],
      small_cap: [
        "Quant Small Cap",
        "Nippon India Small Cap",
        "SBI Small Cap",
      ],
      elss: [
        "Mirae Asset Tax Saver",
        "Quant Tax Plan",
      ],
      index: [
        "UTI Nifty 50 Index",
        "HDFC Index Nifty 50",
      ],
      debt: [
        "HDFC Short Term Debt",
        "ICICI Prudential Short Term",
      ],
    };

    const fundNames = categoryFunds[category] || categoryFunds.flexi_cap;
    const results = [];

    for (const name of fundNames.slice(0, count)) {
      const code = this.popularFunds[name];
      if (code) {
        try {
          const data = await this.getFundData(code);
          if (!data.error) results.push(data);
        } catch (e) {
          // Skip failed ones
        }
        await new Promise((r) => setTimeout(r, 300)); // Rate limit
      }
    }

    return {
      category,
      funds: results,
      count: results.length,
      source: "MFAPI.in (free)",
      disclaimer: "Past returns do not guarantee future performance",
    };
  }

  // ──────────────────────────────────────────
  // 🔍 Search Fund by Name (FREE)
  // ──────────────────────────────────────────
  async searchFund(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
      );
      const results = await response.json();
      return results.slice(0, 10); // Return top 10 matches
    } catch (error) {
      return { error: "Search failed", message: error.message };
    }
  }
}