import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    sessionDate: { type: String }, // "2026-04-13" for daily grouping
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ChatHistory", chatSchema);