import { Router } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import Expense from "../models/Expense.js";
import Investment from "../models/Investment.js";
import Salary from "../models/Salary.js";
import ChatHistory from "../models/ChatHistory.js";

const router = Router();

// Clean database (Nuke all users and associated collections)
router.get("/nuke-all-users", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    // Clear all documents in all collections dynamically
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    res.json({
      success: true,
      message: `Database cleaned successfully! Cleared ${userCount} users and all associated financial collections. You can now register a fresh account.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "default_super_secret_friday_key",
      { expiresIn: "90d" } // Long token for convenience
    );

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
      greeting: `Welcome to FRIDAY, ${name}! 🤖 I'm your personal financial advisor. Let's manage your money like a boss!`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "default_super_secret_friday_key",
      { expiresIn: "90d" }
    );

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      greeting: `Welcome back, Boss! 🤖 FRIDAY is ready to help.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set/Update Security PIN (PocketPin)
router.put("/pin", auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be a 4-digit number" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.pin = pin;
    await user.save();

    res.json({ success: true, message: "Security PIN updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login via Security PIN (PocketPin)
router.post("/login-pin", async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ error: "Email and PIN are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pin) {
      return res.status(400).json({ error: "No security PIN set for this account. Please login with password first." });
    }

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect Security PIN" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "default_super_secret_friday_key",
      { expiresIn: "90d" }
    );

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      greeting: `Welcome back, Boss! 🤖 Logged in securely via PocketPin.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update financial profile
router.put("/profile", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { financialProfile: req.body.financialProfile },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add family member
router.post("/family/add", auth, async (req, res) => {
  try {
    const { name, email, password, familyRole } = req.body;
    const currentUser = await User.findById(req.user.id);

    // Create family group ID if doesn't exist
    const familyGroupId =
      currentUser.familyGroupId || `family_${currentUser._id}`;

    // Update current user's family group
    if (!currentUser.familyGroupId) {
      currentUser.familyGroupId = familyGroupId;
      await currentUser.save();
    }

    // Create family member account
    const member = await User.create({
      name,
      email,
      password,
      familyRole,
      familyGroupId,
    });

    res.status(201).json({
      success: true,
      message: `${name} added to your FRIDAY family! 👨‍👩‍👧‍👦`,
      member: member.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get family members
router.get("/family", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.familyGroupId) {
      return res.json({ success: true, family: [currentUser] });
    }

    const family = await User.find({
      familyGroupId: currentUser.familyGroupId,
    }).select("-password");

    res.json({ success: true, family });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user account and all associated collections permanently
router.delete("/delete-account", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Delete user from MongoDB
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Delete all related data collections
    await Expense.deleteMany({ userId });
    await Investment.deleteMany({ userId });
    await Salary.deleteMany({ userId });
    await ChatHistory.deleteMany({ userId });

    res.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;