import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { adminAuth } from "../middleware/admin.js";

const router = Router();

// List all users
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password -pin");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nuke database (wipe all users and associated collections)
router.post("/nuke-all-users", auth, adminAuth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    res.json({
      success: true,
      message: `Database cleaned successfully! Cleared ${userCount} users and all associated financial collections.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
