// ============================================================
// 🗄️ MongoDB Atlas — FREE 512MB Forever
// ============================================================
// 1. Go to https://cloud.mongodb.com
// 2. Create FREE shared cluster (M0)
// 3. Create database user
// 4. Get connection string
// 5. Paste in .env as MONGODB_URI
// ============================================================

import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "friday_finance",
    });
    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.error(
      "💡 Get free MongoDB: https://cloud.mongodb.com (M0 free tier)"
    );
    process.exit(1);
  }
};