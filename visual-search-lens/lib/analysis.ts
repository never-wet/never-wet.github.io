import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ImageSearchAnalysis = {
  description: string;
  keywords: string[];
  search_queries: string[];
  style: {
    type: string;
    genre: string;
    aesthetic: string;
    lighting: string;
    composition: string;
    camera_angle: string;
    mood: string;
  };
  colors: Array<{
    hex: string;
    name: string;
  }>;
  tags: string[];
  objects: string[];
  setting: string;
  brands: string[];
  similar_image_guidance: string[];
  notes: string;
};

export class OpenAIConfigurationError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured.");
    this.name = "OpenAIConfigurationError";
  }
}

const LOCAL_KEY_FILE = "OPENAI_API_KEY.txt";

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "description",
    "keywords",
    "search_queries",
    "style",
    "colors",
    "tags",
    "objects",
    "setting",
    "brands",
    "similar_image_guidance",
    "notes"
  ],
  properties: {
    description: {
      type: "string",
      description:
        "One specific searchable sentence covering subject, environment, lighting, angle, composition, mood, and color palette."
    },
    keywords: {
      type: "array",
      minItems: 15,
      maxItems: 30,
      items: { type: "string" }
    },
    search_queries: {
      type: "array",
      minItems: 5,
      maxItems: 10,
      items: { type: "string" }
    },
    style: {
      type: "object",
      additionalProperties: false,
      required: ["type", "genre", "aesthetic", "lighting", "composition", "camera_angle", "mood"],
      properties: {
        type: { type: "string" },
        genre: { type: "string" },
        aesthetic: { type: "string" },
        lighting: { type: "string" },
        composition: { type: "string" },
        camera_angle: { type: "string" },
        mood: { type: "string" }
      }
    },
    colors: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["hex", "name"],
        properties: {
          hex: {
            type: "string",
            pattern: "^#[0-9A-Fa-f]{6}$"
          },
          name: { type: "string" }
        }
      }
    },
    tags: {
      type: "array",
      minItems: 8,
      maxItems: 20,
      items: { type: "string" }
    },
    objects: {
      type: "array",
      minItems: 0,
      maxItems: 20,
      items: { type: "string" }
    },
    setting: { type: "string" },
    brands: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    similar_image_guidance: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" }
    },
    notes: {
      type: "string",
      description:
        "Mention unclear image quality, ambiguity, multiple subjects, or brand uncertainty. Use an empty string only when there are no issues."
    }
  }
} as const;

const SYSTEM_PROMPT = `You analyze images for visual search and similar-image discovery.

Your job is not to caption the image. Your job is to help someone find visually similar images online.

Return only valid JSON matching the provided schema.

Rules:
- Be specific, concrete, and searchable.
- Description must include subject, environment, lighting, camera angle, composition, mood, and color palette.
- Generate 15 to 30 useful keywords spanning subject, style, lighting, environment, camera, and photography terms.
- Generate 5 to 10 realistic Google image search queries. Use natural search phrases, not comma dumps.
- Include style classification: type, genre, aesthetic, lighting, composition, camera angle, and mood.
- Extract 5 to 8 dominant colors with hex codes and plain color names.
- Include tags that are short and useful for organizing or searching.
- Include visible objects and setting when detectable.
- Never invent a brand. Only include brands when a logo or text is clearly visible.
- If the image is unclear, say so in notes and still provide the best safe search guidance.
- If there are multiple subjects, list them in objects and make the search queries cover the main visual patterns.`;

type OpenAIResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: unknown;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export function normalizeOpenAIKey(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) return undefined;

  const cleaned = trimmed
    .replace(/^OPENAI_API_KEY\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  const embeddedKey = cleaned.match(/sk-[0-9A-Za-z_-]{20,}/)?.[0];

  return embeddedKey || cleaned;
}

export function getOpenAIKey() {
  const apiKey = normalizeOpenAIKey(process.env.OPENAI_API_KEY) || readLocalOpenAIKey();

  if (!apiKey) {
    throw new OpenAIConfigurationError();
  }

  return apiKey;
}

function readLocalOpenAIKey() {
  const keyFilePath = join(process.cwd(), LOCAL_KEY_FILE);

  if (!existsSync(keyFilePath)) return undefined;

  try {
    return normalizeOpenAIKey(readFileSync(keyFilePath, "utf8"));
  } catch {
    return undefined;
  }
}

function extractOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text.trim();
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if ((content.type === "output_text" || content.type === "text") && typeof content.text === "string") {
        return content.text.trim();
      }
    }
  }

  return "";
}

export async function analyzeImageForSearch(imageDataUrl: string) {
  const apiKey = getOpenAIKey();
  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: SYSTEM_PROMPT
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this image for finding visually similar images online. Return structured JSON only."
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high"
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "image_search_analysis",
          strict: true,
          schema: ANALYSIS_SCHEMA
        }
      },
      temperature: 0.2,
      max_output_tokens: 1600
    })
  });

  const payload = (await response.json().catch(() => null)) as OpenAIResponsePayload | null;

  if (!response.ok) {
    const message = payload?.error?.message || "OpenAI analysis request failed.";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const outputText = payload ? extractOutputText(payload) : "";

  if (!outputText) {
    throw new Error("The model returned an empty analysis.");
  }

  return JSON.parse(outputText) as ImageSearchAnalysis;
}
