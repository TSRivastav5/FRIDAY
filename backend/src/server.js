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
import pushRoutes from "./routes/push.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// ── Fail-fast: catch missing env vars on startup ─────────────────────────────
const REQUIRED_ENV = ["GROQ_API_KEY", "MONGODB_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error("\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:", missingEnv.join(", "));
  console.error("   → On Render: go to Dashboard → Your Service → Environment → Add variables");
  console.error("   → Required: GROQ_API_KEY, MONGODB_URI, JWT_SECRET");
  console.error("   → The server will start but AI routes will return 500 until these are set.\n");
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow any origin for testing/Vercel deployment, or fallback to FRONTEND_URL
      callback(null, true);
    },
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
app.use("/api/push", pushRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "🟢 FRIDAY is alive!",
    version: "1.0.0",
    cost: "₹0/month",
    ai: "Groq Cloud (free)",
    database: "MongoDB Atlas (free)",
    timestamp: new Date().toISOString(),
    // Safe diagnostic — only shows presence, never the key value
    groqKeySet: !!process.env.GROQ_API_KEY,
    groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
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
║  🧠 Groq Cloud (free) ✅                       ║
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