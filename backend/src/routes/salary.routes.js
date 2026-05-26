import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Salary from "../models/Salary.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const salaries = await Salary.find({ userId: req.user.id })
      .sort({ creditDate: -1 })
      .limit(12);
    res.json({ success: true, salaries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/current", async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const salary = await Salary.findOne({
      userId: req.user.id,
      month,
    });
    res.json({ success: true, salary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/allocation", async (req, res) => {
  try {
    const updateObj = {};
    if (req.body.allocation) {
      updateObj.allocation = req.body.allocation;
      updateObj.userAdjusted = true;
    }
    if (req.body.paidAllocations !== undefined) {
      updateObj.paidAllocations = req.body.paidAllocations;
    }

    const salary = await Salary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateObj,
      { new: true }
    );
    if (!salary) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, salary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;