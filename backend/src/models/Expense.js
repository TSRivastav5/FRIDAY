import mongoose from "mongoose";

// Canonical Title Case values match the frontend's expenseCategories list
// exactly (this is what the "Add Expense" form sends).
const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Groceries",
  "Fuel",
  "Subscriptions",
  "EMI",
  "Rent",
  "Insurance",
  "Other",
];

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
      enum: EXPENSE_CATEGORIES,
      // Normalizes any case (e.g. from the AI chat tool, which isn't
      // constrained to an exact string) so "food" / "FOOD" / "Food" all
      // resolve to the same enum value instead of failing validation.
      set: (v) => {
        if (!v) return v;
        return EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === v.toLowerCase()) || v;
      },
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