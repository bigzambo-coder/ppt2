import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle } from "../theme";

/**
 * 2~4 parallel offerings (사업영역, 제품군, 서비스). Unlike `process`, these are
 * peers with no order, so there's no numbering or connector — each card carries
 * an accent rule at the top instead.
 */
export function renderCards(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const cards = (content.cards ?? []).slice(0, 4);
  if (cards.length === 0) return;

  const areaTop = 2.05;
  const areaH = SLIDE_H - areaTop - MARGIN;
  const gap = 0.42;
  const totalW = SLIDE_W - MARGIN * 2;
  const cardW = (totalW - gap * (cards.length - 1)) / cards.length;

  const top = areaTop + 0.35;

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardW + gap);
    const accent = design.accent[i % Math.max(design.accent.length, 1)] ?? design.primary;

    // Editorial columns instead of UI cards: number, rule, headline, explanation.
    // This keeps the slide looking like a presentation rather than a dashboard.
    slide.addText(String(i + 1).padStart(2, "0"), {
      x, y: top, w: cardW, h: 0.55, fontFace: design.fontHeading, fontSize: 28,
      bold: true, color: accent, margin: 0,
    });
    slide.addShape("rect", {
      x, y: top + 0.72, w: cardW, h: 0.045,
      fill: { color: accent },
      line: { type: "none" },
    });

    slide.addText(card.title, {
      x, y: top + 1.02, w: cardW, h: 0.95,
      fontFace: design.fontHeading,
      fontSize: cards.length <= 2 ? 24 : 20,
      bold: true,
      color: design.textPrimary,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
    slide.addText(card.description, {
      x, y: top + 2.02, w: cardW, h: areaH - 2.25,
      fontFace: design.fontBody,
      fontSize: cards.length <= 2 ? 17 : 15,
      color: design.textSecondary,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
  });
}
