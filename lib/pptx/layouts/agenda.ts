import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { MARGIN, SLIDE_H, SLIDE_W, addKicker, paintBackground } from "../theme";

/** Dedicated agenda organism from ppt-template-kit: large index, label and rule. */
export function renderAgenda(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addKicker(slide, design, "AGENDA");
  slide.addText(content.title ?? "목차", {
    x: MARGIN, y: 0.78, w: 5, h: 0.65, fontFace: design.fontHeading,
    fontSize: 34, bold: true, color: design.textPrimary, margin: 0,
  });
  const items = (content.milestones ?? []).slice(0, 6);
  const top = 1.72;
  const rowH = (SLIDE_H - top - MARGIN) / Math.max(items.length, 1);
  items.forEach((item, i) => {
    const y = top + i * rowH;
    const accent = i === 0 ? design.accent[0] ?? design.primary : design.primary;
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: MARGIN, y: y + 0.08, w: 0.62, h: 0.36, fontFace: design.fontHeading,
      fontSize: 15, bold: true, color: accent, margin: 0,
    });
    slide.addText(item.what, {
      x: MARGIN + 0.92, y: y + 0.04, w: 6.3, h: 0.42, fontFace: design.fontBody,
      fontSize: 16, bold: i === 0, color: design.textPrimary, margin: 0,
    });
    slide.addText(item.when, {
      x: SLIDE_W - MARGIN - 2.1, y: y + 0.04, w: 2.1, h: 0.4, fontFace: design.fontBody,
      fontSize: 12, align: "right", color: design.textSecondary, margin: 0,
    });
    slide.addShape("line", {
      x: MARGIN + 0.92, y: y + rowH - 0.14, w: SLIDE_W - MARGIN * 2 - 0.92, h: 0,
      line: { color: design.surface, width: 1 },
    });
  });
}
