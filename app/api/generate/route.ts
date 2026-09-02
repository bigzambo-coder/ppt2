import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Brief, GeneratedDeck } from "@/lib/types";
import { getDocTypeSpec, isDocType } from "@/lib/doctypes/registry";
import { resolveSlideCount } from "@/lib/doctypes/spec";
import { classifyInstitution } from "@/lib/classifier";
import { researchInstitution } from "@/lib/research";
import { pickDesign } from "@/lib/design/engine";
import { generateContent } from "@/lib/content/generate";
import { buildPptx } from "@/lib/pptx/build";
import { runQa } from "@/lib/pptx/qa";
import { saveDeck } from "@/lib/storage";
import type { PlannedSlide } from "@/lib/content/blueprint";

function sanitizeFileNamePart(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60) || "제목없음";
}

function num(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function briefVariant(brief: Brief): number {
  const text = `${brief.topic}|${brief.audience ?? ""}|${brief.durationMinutes ?? ""}|${brief.institutionName}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return Math.abs(hash) % 12;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  if (!isDocType(body.docType)) {
    return NextResponse.json({ error: "문서 유형을 선택해 주세요." }, { status: 400 });
  }
  const spec = getDocTypeSpec(body.docType);

  // Every doc type declares its own required fields — validate against the spec
  // rather than against a hardcoded list, so a new doc type is enforced for free.
  const fields = (body.fields ?? {}) as Record<string, string>;
  const missing = spec.fields
    .filter((f) => f.required && !String(fields[f.name] ?? "").trim())
    .map((f) => f.label);
  if (missing.length > 0) {
    return NextResponse.json({ error: `${missing.join(", ")}을(를) 입력해 주세요.` }, { status: 400 });
  }

  try {
    const brief: Brief = {
      docType: spec.id,
      topic: String(fields.topic ?? "").trim(),
      institutionName: String(fields.institutionName ?? "").trim(),
      institutionUrl: fields.institutionUrl?.trim() || undefined,
      audience: fields.audience?.trim() || undefined,
      durationMinutes: num(fields.durationMinutes),
      slideCount: num(fields.slideCount),
      tone: fields.tone?.trim() || undefined,
      mustInclude: fields.mustInclude?.trim() || undefined,
      fields,
    };

    const classification = classifyInstitution({
      institutionName: brief.institutionName,
      topic: brief.topic,
      audience: brief.audience,
      mustInclude: brief.mustInclude,
    });

    const research = await researchInstitution({
      institutionName: brief.institutionName,
      institutionUrl: brief.institutionUrl,
      topic: brief.topic,
      audience: brief.audience,
      angles: spec.researchAngles,
    });
    const sources = research?.sources ?? [];

    const design = pickDesign({
      docType: spec.id,
      institutionType: classification.type,
      institutionName: brief.institutionName,
      topic: brief.topic,
      audience: brief.audience,
      brandColors: research?.themeColor ? [research.themeColor] : undefined,
      variant: body.designVariant !== undefined ? Number(body.designVariant) || 0 : briefVariant(brief),
    });

    const slideCount = resolveSlideCount(spec, brief);
    const approvedPlan = Array.isArray(body.approvedPlan) ? body.approvedPlan as PlannedSlide[] : undefined;
    const { slides, usedLlm, llmError } = await generateContent({ brief, spec, classification, sources, slideCount, approvedPlan });

    const qa = runQa(slides, sources);
    const pptxBuffer = await buildPptx(slides, design, sources);

    const id = randomUUID();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `${sanitizeFileNamePart(brief.institutionName)}_${sanitizeFileNamePart(
      brief.topic
    )}_${spec.label}_${dateStr}.pptx`;

    const deck: GeneratedDeck = {
      id,
      brief,
      classification,
      design,
      slides,
      createdAt: new Date().toISOString(),
      fileName,
      usedLlm,
      llmError,
      qa,
      sources,
    };

    await saveDeck(deck, pptxBuffer);
    return NextResponse.json({ deck });
  } catch (err) {
    console.error("POST /api/generate failed", err);
    const message = err instanceof Error ? err.message : "알 수 없는 서버 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
