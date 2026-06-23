import { GoogleGenAI } from "@google/genai";

export function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log(
      "⚠️ No GEMINI_API_KEY found or default placeholder detected. Server running with simulation engine fallback.",
    );
    return null;
  }

  try {
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("✅ Gemini API initialized successfully on server-side.");
    return client;
  } catch (err) {
    console.error("❌ Failed to instantiate GoogleGenAI client:", err);
    return null;
  }
}
