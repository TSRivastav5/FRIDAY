import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    pin: { type: String }, // Hashed 4-digit security PIN

    // Family member? (for multi-user family support)
    familyRole: {
      type: String,
      enum: ["self", "spouse", "parent", "child"],
      default: "self",
    },
    familyGroupId: { type: String }, // Same ID = same family

    // Financial Profile
    financialProfile: {
      monthlySalary: { type: Number, default: 0 },
      salaryDay: { type: Number, default: 1 },
      riskProfile: {
        type: String,
        enum: ["conservative", "moderate", "aggressive"],
        default: "moderate",
      },
      investmentGoal: {
        type: String,
        default: "wealth_creation",
      },

      // Fixed Monthly Commitments
      fixedExpenses: {
        rent: { type: Number, default: 0 },
        emis: [
          {
            name: String,
            amount: Number,
            endDate: Date,
            type: {
              type: String,
              enum: ["home", "car", "personal", "education"],
            },
          },
        ],
        insurance: { type: Number, default: 0 },
        subscriptions: { type: Number, default: 0 },
      },

      // Emergency Fund
      emergencyFund: {
        target: { type: Number, default: 0 },
        current: { type: Number, default: 0 },
      },

      // Tax Info (Indian)
      taxInfo: {
        regime: { type: String, enum: ["old", "new"], default: "new" },
        section80C_used: { type: Number, default: 0 },
        section80D_used: { type: Number, default: 0 },
        pan: { type: String }, // Encrypted in production
      },
    },

    // App Settings
    settings: {
      darkMode: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
      currency: { type: String, default: "INR" },
      // Array of browser push subscription objects (one per device/browser)
      pushSubscriptions: {
        type: [
          {
            endpoint: { type: String, required: true },
            expirationTime: { type: Number, default: null },
            keys: {
              p256dh: { type: String, required: true },
              auth: { type: String, required: true },
            },
          },
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password and pin before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.isModified("pin") && this.pin) {
    this.pin = await bcrypt.hash(this.pin, 12);
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare security PIN
userSchema.methods.comparePin = async function (candidatePin) {
  if (!this.pin) return false;
  return bcrypt.compare(candidatePin, this.pin);
};

// Never return password or pin in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.pin;
  return obj;
};

export default mongoose.model("User", userSchema);