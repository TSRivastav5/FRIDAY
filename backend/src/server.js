import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";

import authRoutes from "./routes/auth.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import investmentRoutes from "./routes/investment.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Rate limiting
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

// Stricter limit for AI endpoints (Gemini free has 15 RPM)
app.use(
  "/api/ai/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error:
        "Too many AI requests. Free tier allows 15/minute. Please wait.",
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "🟢 FRIDAY is alive!",
    version: "1.0.0",
    cost: "₹0/month",
    ai: "Google Gemini (free)",
    database: "MongoDB Atlas (free)",
    timestamp: new Date().toISOString(),
  });
});

// Welcome
app.get("/", (req, res) => {
  res.json({
    message: "🤖 FRIDAY API — Your Free AI Financial Advisor",
    health: "/api/health",
    docs: "See README.md",
  });
});

// Error handler
app.use(errorHandler);

// Start
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║  🤖 FRIDAY Backend (100% FREE)                ║
║  📡 http://localhost:${PORT}                     ║
║  🗄️  MongoDB Atlas (free) ✅                   ║
║  🧠 Google Gemini (free) ✅                    ║
║  📈 Yahoo Finance (free) ✅                    ║
║  📊 MFAPI.in (free) ✅                        ║
║  💰 Total Cost: ₹0/month                      ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
};

startServer();

export default app;