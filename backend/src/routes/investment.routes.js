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

// Get market quote for a symbol (free Yahoo Finance lookup)
router.get("/market/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const data = await response.json();
    
    if (data.chart?.error) {
      return res.status(404).json({ error: data.chart.error.description });
    }
    
    const quote = data.chart.result[0];
    const meta = quote.meta;
    
    const result = {
      symbol: symbol,
      name: symbol === "^NSEI" ? "Nifty 50" : (symbol === "^BSESN" ? "BSE Sensex" : symbol),
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      currency: meta.currency || "INR",
    };
    
    res.json({ success: true, quote: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
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