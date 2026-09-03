import { NextRequest, NextResponse } from "next/server";
import { GeneratedDeck, SlideContent } from "@/lib/types";
import { getDocTypeSpec } from "@/lib/doctypes/registry";
import { pickDesign } from "@/lib/design/engine";
import { buildPptx } from "@/lib/pptx/build";
import { runQa } from "@/lib/pptx/qa";
import { getDeckMeta, saveDeck } from "@/lib/storage";
import { normalizeDeckSlides } from "@/lib/content/slide-contract";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getDeckMeta(id);
  if (!deck) return NextResponse.json({ error: "문서를 찾을 수 없어요." }, { status: 404 });
  return NextResponse.json({ deck });
}

/**
 * Applies the user's preview edits: re-runs QA and re-renders the .pptx from the
 * edited slides, saving over the same id. This is what makes the preview real —
 * what you approved on screen is exactly what the downloaded file contains,
 * because the download is rebuilt from the edited slides rather than from the
 * original generation.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { slides?: SlideContent[]; designVariant?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const existing = await getDeckMeta(id);
  if (!existing) return NextResponse.json({ error: "문서를 찾을 수 없어요." }, { status: 404 });

  try {
    const slides = normalizeDeckSlides(Array.isArray(body.slides) && body.slides.length > 0 ? body.slides : existing.slides);

    const design =
      typeof body.designVariant === "number"
        ? pickDesign({
            docType: existing.brief.docType,
            institutionType: existing.classification.type,
            institutionName: existing.brief.institutionName,
            topic: existing.brief.topic,
            audience: existing.brief.audience,
            variant: body.designVariant,
          })
        : existing.design;

    const qa = runQa(slides, existing.sources);
    const pptxBuffer = await buildPptx(slides, design, existing.sources);

    const deck: GeneratedDeck = { ...existing, slides, design, qa };
    await saveDeck(deck, pptxBuffer);

    return NextResponse.json({ deck });
  } catch (err) {
    console.error(`PATCH /api/deck/${id} failed`, err);
    const message = err instanceof Error ? err.message : "저장 중 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Design alternatives for the preview's palette switcher. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getDeckMeta(id);
  if (!deck) return NextResponse.json({ error: "문서를 찾을 수 없어요." }, { status: 404 });

  const { designAlternatives } = await import("@/lib/design/engine");
  const spec = getDocTypeSpec(deck.brief.docType);

  return NextResponse.json({
    docTypeLabel: spec.label,
    alternatives: designAlternatives({
      docType: deck.brief.docType,
      institutionType: deck.classification.type,
      institutionName: deck.brief.institutionName,
      topic: deck.brief.topic,
      audience: deck.brief.audience,
    }),
  });
}
