import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle } from "../theme";

export function renderStats(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const stats = content.stats ?? [];
  if (stats.length === 0) return;

  const top = 2.6;
  const bottom = SLIDE_H - MARGIN;
  const gap = 0.3;
  const totalW = SLIDE_W - MARGIN * 2;
  const cellW = (totalW - gap * (stats.length - 1)) / stats.length;

  stats.forEach((stat, i) => {
    const x = MARGIN + i * (cellW + gap);
    const accent = design.accent[i % Math.max(design.accent.length, 1)] ?? design.primary;

    slide.addText(stat.value, {
      x,
      y: top,
      w: cellW,
      h: bottom - top - 1.0,
      align: "center",
      valign: "bottom",
      fontFace: design.fontHeading,
      fontSize: 44,
      bold: true,
      color: accent,
    });
    slide.addText(stat.label, {
      x,
      y: bottom - 0.8,
      w: cellW,
      h: 0.6,
      align: "center",
      fontFace: design.fontBody,
      fontSize: 14,
      color: design.textSecondary,
    });
  });
}
