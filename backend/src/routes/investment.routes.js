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

// Add investment
router.post("/", async (req, res) => {
  try {
    const investment = await Investment.create({
      userId: req.user.id,
      ...req.body,
    });
    res.status(201).json({ success: true, investment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update investment
router.put("/:id", async (req, res) => {
  try {
    const investment = await Investment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, investment });
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