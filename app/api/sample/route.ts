import { NextRequest, NextResponse } from "next/server";
import { Brief } from "@/lib/types";
import type { PlannedSlide } from "@/lib/content/blueprint";
import { getDocTypeSpec, isDocType } from "@/lib/doctypes/registry";
import { classifyInstitution } from "@/lib/classifier";
import { researchInstitution } from "@/lib/research";
import { pickDesign } from "@/lib/design/engine";
import { generateContent } from "@/lib/content/generate";

function num(value: unknown): number | undefined { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : undefined; }

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  if (!isDocType(body.docType)) return NextResponse.json({ error: "문서 유형이 올바르지 않아요." }, { status: 400 });
  const spec = getDocTypeSpec(body.docType);
  const fields = (body.fields ?? {}) as Record<string, string>;
  const plan = Array.isArray(body.approvedPlan) ? body.approvedPlan as PlannedSlide[] : [];
  if (plan.length < 3) return NextResponse.json({ error: "승인할 목차가 부족합니다." }, { status: 400 });
  const brief: Brief = { docType: spec.id, topic: String(fields.topic ?? "").trim(), institutionName: String(fields.institutionName ?? "").trim(), institutionUrl: fields.institutionUrl?.trim() || undefined, audience: fields.audience?.trim() || undefined, durationMinutes: num(fields.durationMinutes), slideCount: num(fields.slideCount), tone: fields.tone?.trim() || undefined, mustInclude: fields.mustInclude?.trim() || undefined, fields };
  const classification = classifyInstitution({ institutionName: brief.institutionName, topic: brief.topic, audience: brief.audience, mustInclude: brief.mustInclude });
  const research = await researchInstitution({ institutionName: brief.institutionName, institutionUrl: brief.institutionUrl, topic: brief.topic, audience: brief.audience, angles: spec.researchAngles });
  const sources = research?.sources ?? [];
  const practiceCandidates = plan.filter((p, i) => i > Math.floor(plan.length * 0.45) && i < plan.length - 1 && /실습|연습|미션|프롬프트|만들|제작|참여자|결과물/.test(`${p.sectionId} ${p.sectionTitle} ${p.purpose} ${p.narrativeJob} ${p.visualBrief}`) && !/정리|회고|마무리/.test(p.sectionTitle));
  const practice = practiceCandidates.find((p) => ["process", "visual", "compare", "cards"].includes(p.layouts[0])) ?? practiceCandidates[0];
  const concept = plan.find((p, i) => i > 0 && i < plan.length - 1 && ["visual", "compare", "process", "chart"].includes(p.layouts[0]));
  const picked = [plan[0], concept ?? plan[Math.floor(plan.length / 2)], practice ?? plan[plan.length - 2]].filter((p, i, a) => a.findIndex((x) => x.index === p.index) === i).slice(0, 3);
  while (picked.length < 3) { const next = plan.find((p) => !picked.some((x) => x.index === p.index)); if (!next) break; picked.push(next); }
  const samplePlan = picked.map((p, index) => ({ ...p, index }));
  const design = pickDesign({ docType: spec.id, institutionType: classification.type, institutionName: brief.institutionName, topic: brief.topic, audience: brief.audience, brandColors: research?.themeColor ? [research.themeColor] : undefined, variant: Number(body.designVariant) || 0 });
  const result = await generateContent({ brief, spec, classification, sources, slideCount: samplePlan.length, approvedPlan: samplePlan });
  return NextResponse.json({ slides: result.slides, sourceIndices: picked.map((p) => p.index), design, sources, usedLlm: result.usedLlm, error: result.llmError });
}
