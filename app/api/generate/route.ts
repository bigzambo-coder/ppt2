import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Brief, DocType, GeneratedDeck } from "@/lib/types";
import { classifyInstitution } from "@/lib/classifier";
import { researchInstitution } from "@/lib/research";
import { pickDesign } from "@/lib/design/engine";
import { generateContent } from "@/lib/content/generate";
import { buildPptx } from "@/lib/pptx/build";
import { runQa } from "@/lib/pptx/qa";
import { saveDeck } from "@/lib/storage";

const DOC_TYPES: DocType[] = ["proposal", "presentation", "intro"];

function sanitizeFileNamePart(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60) || "제목없음";
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!DOC_TYPES.includes(body.docType)) {
    return NextResponse.json({ error: "docType은 proposal/presentation/intro 중 하나여야 해요." }, { status: 400 });
  }
  if (!body.topic || !body.institutionName) {
    return NextResponse.json({ error: "topic과 institutionName은 필수예요." }, { status: 400 });
  }

  const brief: Brief = {
    docType: body.docType,
    topic: String(body.topic),
    institutionName: String(body.institutionName),
    institutionUrl: body.institutionUrl || undefined,
    audience: body.audience || undefined,
    durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : undefined,
    slideCount: body.slideCount ? Number(body.slideCount) : undefined,
    tone: body.tone || undefined,
    mustInclude: body.mustInclude || undefined,
    presenterName: body.presenterName || undefined,
    presenterTitle: body.presenterTitle || undefined,
    presenterOrg: body.presenterOrg || undefined,
    presenterBio: body.presenterBio || undefined,
    contact: body.contact || undefined,
  };

  const classification = classifyInstitution(brief);

  const research = await researchInstitution({
    institutionName: brief.institutionName,
    institutionUrl: brief.institutionUrl,
    topic: brief.topic,
  });

  const design = pickDesign({
    institutionType: classification.type,
    institutionName: brief.institutionName,
    topic: brief.topic,
    audience: brief.audience,
    brandColors: research?.themeColor ? [research.themeColor] : undefined,
  });

  const { slides, usedLlm } = await generateContent({ brief, classification, research });
  const qa = runQa(slides);
  const pptxBuffer = await buildPptx(slides, design);

  const id = randomUUID();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const docTypeLabel = { proposal: "제안서", presentation: "발표PPT", intro: "소개서" }[brief.docType];
  const fileName = `${sanitizeFileNamePart(brief.institutionName)}_${sanitizeFileNamePart(brief.topic)}_${docTypeLabel}_${dateStr}.pptx`;

  const deck: GeneratedDeck = {
    id,
    brief,
    classification,
    design,
    slides,
    createdAt: new Date().toISOString(),
    fileName,
    usedLlm,
    qa,
  };

  await saveDeck(deck, pptxBuffer);

  return NextResponse.json({ deck });
}
