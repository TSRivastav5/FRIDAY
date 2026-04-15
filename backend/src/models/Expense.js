import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "food",
        "travel",
        "shopping",
        "bills",
        "entertainment",
        "health",
        "education",
        "groceries",
        "fuel",
        "subscriptions",
        "emi",
        "rent",
        "insurance",
        "other",
      ],
    },
    description: { type: String },
    date: { type: Date, default: Date.now },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "upi",
        "credit_card",
        "debit_card",
        "net_banking",
      ],
      default: "upi",
    },

    isRecurring: { type: Boolean, default: false },
    isEssential: { type: Boolean, default: false },

    // Who in the family added this
    addedBy: { type: String, default: "self" },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

export default mongoose.model("Expense", expenseSchema);