import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "sip",
        "stock",
        "mutual_fund",
        "etf",
        "fd",
        "ppf",
        "nps",
        "gold",
        "elss",
      ],
    },
    platform: { type: String, default: "groww" },

    investedAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    units: { type: Number },

    // SIP Details
    sipDetails: {
      monthlyAmount: Number,
      startDate: Date,
      nextDate: Date,
    },

    // Stock Details
    stockDetails: {
      symbol: String,
      exchange: { type: String, enum: ["NSE", "BSE"] },
      sector: String,
      quantity: Number,
      avgBuyPrice: Number,
    },

    // Mutual Fund Details
    mfDetails: {
      schemeCode: Number, // AMFI code
      category: String,
      fundHouse: String,
    },

    // Returns
    returns: {
      absolute: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },

    tags: [String], // ["tax_saving", "long_term", "emergency"]
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

investmentSchema.index({ userId: 1, type: 1 });

export default mongoose.model("Investment", investmentSchema);