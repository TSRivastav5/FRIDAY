// ============================================================
// 🧠 Google Gemini Configuration — FREE FOREVER
// ============================================================
// Google gives 15 requests/minute & 1M tokens/day FREE
// That's MORE than enough for a family finance app
// Get your free key: https://aistudio.google.com/apikey
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using Gemini 1.5 Flash — fastest free model (15 RPM free tier)
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 2048,
  },
});

// For complex financial analysis
export const geminiProModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 4096,
  },
});

export default genAI;