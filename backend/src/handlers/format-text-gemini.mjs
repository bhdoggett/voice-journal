import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export const formatTextHandler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  let text;
  try {
    ({ text } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (!text?.trim()) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "text is required" }) };
  }

  const prompt = `You are a punctuation and formatting assistant. The following text was produced by speech-to-text software and has no punctuation or capitalization. Add appropriate punctuation, capitalization, and paragraph breaks. Do not change, add, or remove any words — only add formatting. Return only the formatted text with no explanation.

Text: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ formattedText: response.text }),
  };
};
