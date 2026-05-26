import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Investment from "../models/Investment.js";

const router = Router();
router.use(auth);

// Get all investments
router.get("/", async (req, res) => {
  try {
    const investments = await Investment.find({
      userId: req.user.id,
      isActive: true,
    }).sort({ updatedAt: -1 });

    const stats = {
      totalInvested: investments.reduce(
        (s, i) => s + i.investedAmount,
        0
      ),
      currentValue: investments.reduce(
        (s, i) => s + i.currentValue,
        0
      ),
    };
    stats.totalGain = stats.currentValue - stats.totalInvested;
    stats.gainPercent =
      stats.totalInvested > 0
        ? ((stats.totalGain / stats.totalInvested) * 100).toFixed(2)
        : 0;

    res.json({ success: true, investments, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── In-memory cache: symbol → { data, expiresAt } ──────────────────────────
const marketCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const SYMBOLS_META = {
  "^NSEI":  { name: "Nifty 50" },
  "^BSESN": { name: "Sensex" },
};

async function fetchYahooQuote(symbol) {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  // Try v8 first, fall back to v7
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
  ];

  for (const url of urls) {
    const resp = await fetch(url, { headers: { "User-Agent": UA } });

    // Read as text first — Yahoo returns plain "Too Many Requests" on 429
    const text = await resp.text();

    if (resp.status === 429 || resp.status === 503) continue; // try next URL
    if (!text || text.startsWith("Too Many") || text.startsWith("<")) continue;

    let parsed;
    try { parsed = JSON.parse(text); } catch { continue; }

    // v8 chart response
    if (parsed?.chart?.result?.[0]) {
      const meta = parsed.chart.result[0].meta;
      return {
        symbol,
        name: SYMBOLS_META[symbol]?.name || symbol,
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose || meta.chartPreviousClose,
        change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose),
        changePercent: ((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100,
        currency: meta.currency || "INR",
      };
    }

    // v7 quote response
    if (parsed?.quoteResponse?.result?.[0]) {
      const q = parsed.quoteResponse.result[0];
      return {
        symbol,
        name: SYMBOLS_META[symbol]?.name || q.shortName || symbol,
        currentPrice: q.regularMarketPrice,
        previousClose: q.regularMarketPreviousClose,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        currency: q.currency || "INR",
      };
    }
  }

  throw new Error("All Yahoo Finance endpoints returned rate-limit or empty responses. Try again in a minute.");
}

// Get market quote for a symbol (free Yahoo Finance lookup) with caching
router.get("/market/quote/:symbol", async (req, res) => {
  const { symbol } = req.params;

  // Return cached value if fresh
  const cached = marketCache.get(symbol);
  if (cached && Date.now() < cached.expiresAt) {
    return res.json({ success: true, quote: cached.data, cached: true });
  }

  try {
    const quote = await fetchYahooQuote(symbol);
    marketCache.set(symbol, { data: quote, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json({ success: true, quote });
  } catch (error) {
    // If we have stale cache, return it with a flag rather than failing
    if (cached) {
      return res.json({ success: true, quote: cached.data, cached: true, stale: true });
    }
    res.status(429).json({ error: "Market data temporarily unavailable. Yahoo Finance rate limit reached.", code: "RATE_LIMITED" });
  }
});


// Add investment
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.amount !== undefined && data.investedAmount === undefined) {
      data.investedAmount = data.amount;
    }
    const investment = await Investment.create({
      userId: req.user.id,
      ...data,
    });
    res.status(201).json({ success: true, investment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update investment
router.put("/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.amount !== undefined && data.investedAmount === undefined) {
      data.investedAmount = data.amount;
    }
    const investment = await Investment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      data,
      { new: true }
    );
    res.json({ success: true, investment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all investments (soft delete all for user)
router.delete("/clear/all-assets", async (req, res) => {
  try {
    await Investment.updateMany(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    await Investment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;