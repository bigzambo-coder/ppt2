import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN } from "../theme";

/**
 * Full-bleed closing statement. Left-aligned and large rather than a small
 * centered line with a dot above it — a centered 34pt line on a full-color
 * field reads as a placeholder, while a left-anchored block with a rule reads
 * as a deliberate end card.
 */
export function renderClosing(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  slide.background = { color: design.primary };
  const accent = design.accent[0] ?? design.background;

  slide.addShape("rect", {
    x: MARGIN,
    y: SLIDE_H / 2 - 1.35,
    w: 1.3,
    h: 0.1,
    fill: { color: accent },
    line: { type: "none" },
  });

  slide.addText(content.title ?? "감사합니다", {
    x: MARGIN,
    y: SLIDE_H / 2 - 0.95,
    w: SLIDE_W - MARGIN * 2,
    h: 1.4,
    fontFace: design.fontHeading,
    fontSize: 46,
    bold: true,
    color: design.background,
    valign: "top",
    isTextBox: true,
    margin: 0,
  });

  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: MARGIN,
      y: SLIDE_H / 2 + 0.6,
      w: SLIDE_W - MARGIN * 2,
      h: 0.7,
      fontFace: design.fontBody,
      fontSize: 16,
      color: design.background,
      transparency: 15,
      valign: "top",
      isTextBox: true,
      margin: 0,
    });
  }
}
