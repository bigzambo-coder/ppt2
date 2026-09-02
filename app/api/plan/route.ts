import { NextRequest, NextResponse } from "next/server";
import { Brief } from "@/lib/types";
import { getDocTypeSpec, isDocType } from "@/lib/doctypes/registry";
import { resolveSlideCount } from "@/lib/doctypes/spec";
import { classifyInstitution } from "@/lib/classifier";
import { researchInstitution } from "@/lib/research";
import { designAlternatives } from "@/lib/design/engine";
import { planContent } from "@/lib/content/generate";

function num(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  if (!isDocType(body.docType)) return NextResponse.json({ error: "문서 유형을 선택해 주세요." }, { status: 400 });
  const spec = getDocTypeSpec(body.docType);
  const fields = (body.fields ?? {}) as Record<string, string>;
  const missing = spec.fields.filter((f) => f.required && !String(fields[f.name] ?? "").trim()).map((f) => f.label);
  if (missing.length) return NextResponse.json({ error: `${missing.join(", ")}을(를) 입력해 주세요.` }, { status: 400 });
  const brief: Brief = {
    docType: spec.id, topic: String(fields.topic ?? "").trim(), institutionName: String(fields.institutionName ?? "").trim(),
    institutionUrl: fields.institutionUrl?.trim() || undefined, audience: fields.audience?.trim() || undefined,
    durationMinutes: num(fields.durationMinutes), slideCount: num(fields.slideCount), tone: fields.tone?.trim() || undefined,
    mustInclude: fields.mustInclude?.trim() || undefined, fields,
  };
  const classification = classifyInstitution({ institutionName: brief.institutionName, topic: brief.topic, audience: brief.audience, mustInclude: brief.mustInclude });
  const research = await researchInstitution({ institutionName: brief.institutionName, institutionUrl: brief.institutionUrl, topic: brief.topic, audience: brief.audience, angles: spec.researchAngles });
  const sources = research?.sources ?? [];
  const slideCount = resolveSlideCount(spec, brief);
  const { plan, outlineError } = await planContent({ brief, spec, classification, sources, slideCount });
  const designs = designAlternatives({ docType: spec.id, institutionType: classification.type, institutionName: brief.institutionName, topic: brief.topic, audience: brief.audience, brandColors: research?.themeColor ? [research.themeColor] : undefined }, 3);
  return NextResponse.json({ plan, outlineError, sources, designs, slideCount, classification });
}
