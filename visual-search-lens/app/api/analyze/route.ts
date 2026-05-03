import { NextResponse } from "next/server";

import { OpenAIConfigurationError, analyzeImageForSearch } from "@/lib/analysis";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,/i;
const MISSING_KEY_ERROR =
  "Add an OpenAI API key in .env.local or OPENAI_API_KEY.txt, then restart the Next.js server.";
const NETWORK_ERROR =
  "The image analyzer could not reach the AI service. Please try again.";
const QUOTA_ERROR = "The AI service rate limit or quota was reached. Please try again later.";
const RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

type AnalyzeRequestBody = {
  image?: unknown;
};

function getBase64ByteLength(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.byteLength(base64, "base64");
}

function getErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return error.status;
  }

  return 500;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: RESPONSE_HEADERS
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: RESPONSE_HEADERS
  });
}

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;

  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (typeof body.image !== "string") {
    return json({ error: "Image data URL is required." }, 400);
  }

  const image = body.image.trim();

  if (!DATA_URL_PATTERN.test(image)) {
    return json({ error: "Upload a PNG, JPG, JPEG, or WEBP image." }, 400);
  }

  if (getBase64ByteLength(image) > MAX_IMAGE_BYTES) {
    return json({ error: "Image is too large after compression. Try a smaller image." }, 413);
  }

  try {
    const analysis = await analyzeImageForSearch(image);
    return json(analysis);
  } catch (error) {
    const status = getErrorStatus(error);

    if (error instanceof OpenAIConfigurationError) {
      console.error("Visual Search Lens is missing OPENAI_API_KEY.");
      return json({ error: MISSING_KEY_ERROR }, 500);
    }

    if (status === 401 || status === 403) {
      console.error("OpenAI API key was rejected.");
      return json({ error: "The OpenAI API key was not accepted. Check the key and try again." }, 401);
    }

    if (status === 400) {
      console.error("OpenAI rejected the analyzer request.", error);
      return json(
        {
          error:
            "The AI service rejected the analyzer request. Check OPENAI_VISION_MODEL and the server logs."
        },
        500
      );
    }

    if (status === 429) {
      console.error("OpenAI quota or rate limit error.");
      return json({ error: QUOTA_ERROR }, 429);
    }

    console.error("Image analysis failed.", error);
    return json({ error: NETWORK_ERROR }, 500);
  }
}
