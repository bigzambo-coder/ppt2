import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle } from "../theme";

export function renderStats(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const stats = content.stats ?? [];
  if (stats.length === 0) return;

  // Center the value+label block within the content area rather than pinning it to the
  // bottom — anchoring to the bottom left a large dead zone above the numbers.
  const contentTop = 1.7;
  const contentBottom = SLIDE_H - MARGIN;
  const blockH = 1.3;
  const numberY = contentTop + (contentBottom - contentTop - blockH) / 2;
  const gap = 0.3;
  const totalW = SLIDE_W - MARGIN * 2;
  const cellW = (totalW - gap * (stats.length - 1)) / stats.length;

  stats.forEach((stat, i) => {
    const x = MARGIN + i * (cellW + gap);
    const accent = design.accent[i % Math.max(design.accent.length, 1)] ?? design.primary;

    slide.addText(stat.value, {
      x,
      y: numberY,
      w: cellW,
      h: 0.9,
      align: "center",
      valign: "bottom",
      fontFace: design.fontHeading,
      fontSize: 44,
      bold: true,
      color: accent,
      isTextBox: true,
      margin: 0,
    });
    slide.addText(stat.label, {
      x,
      y: numberY + 0.95,
      w: cellW,
      h: 0.4,
      align: "center",
      fontFace: design.fontBody,
      fontSize: 14,
      color: design.textSecondary,
      isTextBox: true,
      margin: 0,
    });
  });
}
