import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: { type: Number, required: true },
    month: { type: String, required: true }, // "2026-04"
    creditDate: { type: Date, default: Date.now },

    // Allocation
    allocation: {
      emi: { type: Number, default: 0 },
      rent: { type: Number, default: 0 },
      sip: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      bills: { type: Number, default: 0 },
      groceries: { type: Number, default: 0 },
      entertainment: { type: Number, default: 0 },
      savings: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
    },

    paidAllocations: { type: [String], default: [] }, // E.g., ["emi", "rent"]

    // AI Analysis (saved for history)
    aiAnalysis: {
      greeting: String,
      insights: [String],
      investmentSuggestions: [
        {
          name: String,
          type: String,
          amount: Number,
          reason: String,
        },
      ],
      warnings: [String],
      actionItems: [String],
    },

    // User adjusted the AI allocation?
    userAdjusted: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["allocated", "in_progress", "completed"],
      default: "allocated",
    },
  },
  { timestamps: true }
);

salarySchema.index({ userId: 1, month: -1 });

export default mongoose.model("Salary", salarySchema);