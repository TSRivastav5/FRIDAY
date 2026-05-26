// ============================================================
// 🧠 Google Gemini Configuration — FREE FOREVER
// ============================================================
// Google gives 15 requests/minute & 1M tokens/day FREE
// That's MORE than enough for a family finance app
// Get your free key: https://aistudio.google.com/apikey
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using Gemini 2.0 Flash — fastest current free model
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.3,       // Low for financial accuracy
    topP: 0.8,
    maxOutputTokens: 2048,
  },
});

// For complex financial analysis, use Gemini 2.0 Flash (Pro-level, also free)
export const geminiProModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 4096,
  },
});

export default genAI;