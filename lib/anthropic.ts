import Anthropic from "@anthropic-ai/sdk";
import { SlideContent, SlideLayout } from "./types";

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
              enum: [
                "cover",
                "divider",
                "bullets",
                "compare",
                "process",
                "stats",
                "table",
                "quote",
                "timeline",
                "cards",
                "profile",
                "visual",
                "chart",
                "closing",
              ],
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
            milestones: {
              type: "array" as const,
              description: "timeline layout: chronological milestones (연혁/로드맵/일정).",
              items: {
                type: "object" as const,
                properties: {
                  when: { type: "string" as const },
                  what: { type: "string" as const },
                },
                required: ["when", "what"],
              },
            },
            cards: {
              type: "array" as const,
              description: "cards layout: 2~4 parallel offerings (사업영역/제품/서비스).",
              items: {
                type: "object" as const,
                properties: {
                  title: { type: "string" as const },
                  description: { type: "string" as const },
                },
                required: ["title", "description"],
              },
            },
            profile: {
              type: "object" as const,
              description: "profile layout: one person (대표/강사/팀 리드).",
              properties: {
                name: { type: "string" as const },
                role: { type: "string" as const },
                detail: { type: "string" as const },
              },
              required: ["name", "role", "detail"],
            },
            imageUrl: { type: "string" as const, description: "visual layout only. Copy an imageUrl exactly from the provided source ledger." },
            imageCaption: { type: "string" as const },
            imagePosition: { type: "string" as const, enum: ["left", "right", "full"] },
            chartType: { type: "string" as const, enum: ["bar", "line", "donut"] },
            chartData: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: { label: { type: "string" as const }, value: { type: "number" as const } },
                required: ["label", "value"],
              },
            },
            chartInsight: { type: "string" as const },
            sources: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "Source ledger ids (e.g. S1) this slide's factual claims are grounded in. Omit or leave empty if nothing on the slide cites a source.",
            },
          },
          required: ["layout"],
        },
      },
    },
    required: ["slides"],
  },
};

export interface LlmResult {
  slides: SlideContent[] | null;
  /** Why the call produced nothing — surfaced to the user instead of a silent fallback. */
  error?: string;
}

export interface OutlinePage {
  sectionId: string;
  sectionTitle: string;
  purpose: string;
  layout: SlideLayout;
  narrativeJob: string;
  composition: string;
  visualBrief: string;
  evidenceNeed: string;
  research: boolean;
}

const OUTLINE_TOOL = {
  name: "emit_outline",
  description: "Return a topic-specific, page-by-page presentation outline before slide copy is written.",
  input_schema: {
    type: "object" as const,
    properties: {
      pages: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            sectionId: { type: "string" as const }, sectionTitle: { type: "string" as const }, purpose: { type: "string" as const },
            layout: { type: "string" as const, enum: ["cover","divider","bullets","compare","process","stats","table","quote","timeline","cards","profile","visual","chart","closing"] },
            narrativeJob: { type: "string" as const }, composition: { type: "string" as const }, visualBrief: { type: "string" as const }, evidenceNeed: { type: "string" as const }, research: { type: "boolean" as const },
          },
          required: ["sectionId","sectionTitle","purpose","layout","narrativeJob","composition","visualBrief","evidenceNeed","research"],
        },
      },
    },
    required: ["pages"],
  },
};

export async function generateOutlineWithLlm(systemPrompt: string, userPrompt: string): Promise<{ pages: OutlinePage[] | null; error?: string }> {
  const anthropic = getClient();
  if (!anthropic) return { pages: null, error: "ANTHROPIC_API_KEY가 설정되지 않았어요." };
  try {
    const message = await anthropic.messages.create({
      model: MODEL, max_tokens: 12000, system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }], tools: [OUTLINE_TOOL],
      tool_choice: { type: "tool", name: "emit_outline" },
    });
    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return { pages: null, error: "AI 목차 응답 형식이 올바르지 않아요." };
    const input = toolUse.input as { pages?: OutlinePage[] };
    return Array.isArray(input.pages) && input.pages.length ? { pages: input.pages } : { pages: null, error: "AI가 빈 목차를 반환했어요." };
  } catch (err) {
    return { pages: null, error: `AI 목차 생성 실패: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Asks Claude to produce slide content as structured JSON via forced tool-use
 * (far more reliable than asking it to emit raw JSON in prose).
 *
 * max_tokens matters a lot here: a fully-written slide costs roughly 300–500
 * output tokens, so the old 4096 ceiling silently truncated any deck past ~15
 * slides. A truncated response still returns a tool_use block, just with
 * malformed input, which parsed as "no slides" and dropped the user into an
 * empty skeleton labelled "AI 키 없음" even though the key was working. Callers
 * now chunk the deck, and each chunk gets room to finish.
 */
export async function generateSlidesWithLlm(
  systemPrompt: string,
  userPrompt: string
): Promise<LlmResult> {
  const anthropic = getClient();
  if (!anthropic) return { slides: null, error: "ANTHROPIC_API_KEY가 설정되지 않았어요." };

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [SLIDE_TOOL],
      tool_choice: { type: "tool", name: "emit_slides" },
    });

    if (message.stop_reason === "max_tokens") {
      return { slides: null, error: "AI 응답이 길이 제한에 걸렸어요. 슬라이드 수를 줄여 보세요." };
    }

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { slides: null, error: "AI가 예상한 형식으로 응답하지 않았어요." };
    }

    const input = toolUse.input as { slides?: SlideContent[] };
    if (!Array.isArray(input.slides) || input.slides.length === 0) {
      return { slides: null, error: "AI가 빈 결과를 반환했어요." };
    }

    return { slides: input.slides };
  } catch (err) {
    console.error("generateSlidesWithLlm failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { slides: null, error: `AI 호출 실패: ${msg}` };
  }
}
