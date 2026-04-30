import { NextResponse } from "next/server";

import { GeminiConfigurationError, generateGeminiReply } from "@/lib/gemini";

const USER_SAFE_ERROR = "Sorry, I could not get a response. Please try again.";
const MAX_MESSAGE_LENGTH = 4000;
const INVALID_KEY_ERROR = "That Gemini API key was not accepted. Check the key and try again.";
const MISSING_KEY_ERROR =
  "Add a Gemini API key in GEMINI_API_KEY.txt or set GEMINI_API_KEY on the server.";
const QUOTA_ERROR = "Gemini rate limit or quota was reached. Please try again later.";

type ChatRequestBody = {
  message?: unknown;
  apiKey?: unknown;
};

function getErrorStatus(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "number"
  ) {
    return error.code;
  }

  return 500;
}

function normalizeApiKey(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) return undefined;

  const cleaned = trimmed
    .replace(/^GEMINI_API_KEY\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  const embeddedKey = cleaned.match(/AIza[0-9A-Za-z_-]{20,}/)?.[0];

  return embeddedKey || cleaned;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.message !== "string") {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const message = body.message.trim();

  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  if (body.apiKey !== undefined && typeof body.apiKey !== "string") {
    return NextResponse.json({ error: "API key must be a string." }, { status: 400 });
  }

  const apiKeyOverride = normalizeApiKey(body.apiKey);

  try {
    const reply = await generateGeminiReply(message, apiKeyOverride);
    return NextResponse.json({ reply });
  } catch (error) {
    const status = getErrorStatus(error);

    if (error instanceof GeminiConfigurationError) {
      console.error("Gemini chat is missing GEMINI_API_KEY.");
      return NextResponse.json({ error: MISSING_KEY_ERROR }, { status: 500 });
    }

    if (status === 400 || status === 401 || status === 403) {
      console.error("Gemini chat API key was rejected.");
      return NextResponse.json({ error: INVALID_KEY_ERROR }, { status: 401 });
    }

    if (status === 429) {
      console.error("Gemini chat quota or rate limit error.");
      return NextResponse.json({ error: QUOTA_ERROR }, { status: 429 });
    }

    console.error("Gemini chat request failed.", error);
    return NextResponse.json({ error: USER_SAFE_ERROR }, { status: 500 });
  }
}
