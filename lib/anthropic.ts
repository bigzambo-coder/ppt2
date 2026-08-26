import Anthropic from "@anthropic-ai/sdk";
import { SlideContent } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export function hasLlm(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SLIDE_TOOL = {
  name: "emit_slides",
  description: "Return the finished slide-by-slide content for the deck.",
  input_schema: {
    type: "object" as const,
    properties: {
      slides: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            layout: {
              type: "string" as const,
              enum: ["cover", "divider", "bullets", "compare", "process", "stats", "table", "quote", "closing"],
            },
            title: { type: "string" as const },
            subtitle: { type: "string" as const },
            bullets: { type: "array" as const, items: { type: "string" as const } },
            columns: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  title: { type: "string" as const },
                  items: { type: "array" as const, items: { type: "string" as const } },
                },
                required: ["title", "items"],
              },
            },
            steps: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  title: { type: "string" as const },
                  description: { type: "string" as const },
                },
                required: ["title", "description"],
              },
            },
            stats: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  value: { type: "string" as const },
                  label: { type: "string" as const },
                },
                required: ["value", "label"],
              },
            },
            table: {
              type: "object" as const,
              properties: {
                headers: { type: "array" as const, items: { type: "string" as const } },
                rows: {
                  type: "array" as const,
                  items: { type: "array" as const, items: { type: "string" as const } },
                },
              },
              required: ["headers", "rows"],
            },
            quote: { type: "string" as const },
            quoteAttribution: { type: "string" as const },
          },
          required: ["layout"],
        },
      },
    },
    required: ["slides"],
  },
};

/**
 * Asks Claude to produce the deck's slide content as structured JSON via forced tool-use
 * (far more reliable than asking it to emit raw JSON in prose). Returns null on any failure
 * so callers can fall back to the deterministic template content.
 */
export async function generateSlidesWithLlm(
  systemPrompt: string,
  userPrompt: string
): Promise<SlideContent[] | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [SLIDE_TOOL],
      tool_choice: { type: "tool", name: "emit_slides" },
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;

    const input = toolUse.input as { slides?: SlideContent[] };
    if (!Array.isArray(input.slides) || input.slides.length === 0) return null;

    return input.slides;
  } catch (err) {
    console.error("generateSlidesWithLlm failed", err);
    return null;
  }
}
