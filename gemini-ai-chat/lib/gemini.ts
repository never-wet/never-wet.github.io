import { GoogleGenAI } from "@google/genai";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SYSTEM_INSTRUCTION } from "@/lib/aiPrompt";

export const GEMINI_MODEL = "gemini-2.5-flash";
const LOCAL_KEY_FILE = "GEMINI_API_KEY.txt";

export class GeminiConfigurationError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured.");
    this.name = "GeminiConfigurationError";
  }
}

function getGeminiClient(apiKeyOverride?: string) {
  const apiKey =
    normalizeGeminiApiKey(apiKeyOverride) ||
    normalizeGeminiApiKey(process.env.GEMINI_API_KEY) ||
    readLocalGeminiApiKey();

  if (!apiKey) {
    throw new GeminiConfigurationError();
  }

  return new GoogleGenAI({ apiKey });
}

function normalizeGeminiApiKey(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) return undefined;

  const cleaned = trimmed
    .replace(/^GEMINI_API_KEY\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  const embeddedKey = cleaned.match(/AIza[0-9A-Za-z_-]{20,}/)?.[0];

  return embeddedKey || cleaned;
}

function readLocalGeminiApiKey() {
  const keyFilePath = join(process.cwd(), LOCAL_KEY_FILE);

  if (!existsSync(keyFilePath)) return undefined;

  try {
    return normalizeGeminiApiKey(readFileSync(keyFilePath, "utf8"));
  } catch {
    return undefined;
  }
}

export async function generateGeminiReply(message: string, apiKeyOverride?: string) {
  const ai = getGeminiClient(apiKeyOverride);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: message,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  });

  const reply = response.text?.trim();

  if (!reply) {
    throw new Error("Gemini returned an empty response.");
  }

  return reply;
}
