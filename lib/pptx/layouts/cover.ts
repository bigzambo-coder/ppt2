import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H } from "../theme";

export function renderCover(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  slide.background = { color: design.background };

  slide.addShape("rect", {
    x: SLIDE_W * 0.62,
    y: 0,
    w: SLIDE_W * 0.38,
    h: SLIDE_H,
    fill: { color: design.primary },
    line: { type: "none" },
  });
  for (let i = 0; i < design.accent.length; i++) {
    slide.addShape("rect", {
      x: SLIDE_W * 0.62 - 0.12 - i * 0.12,
      y: 0,
      w: 0.08,
      h: SLIDE_H,
      fill: { color: design.accent[i] },
      line: { type: "none" },
    });
  }

  slide.addText(content.title ?? "", {
    x: 0.8,
    y: SLIDE_H / 2 - 1.1,
    w: SLIDE_W * 0.55,
    h: 1.8,
    fontFace: design.fontHeading,
    fontSize: 40,
    bold: true,
    color: design.textPrimary,
    valign: "bottom",
  });

  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: 0.8,
      y: SLIDE_H / 2 + 0.75,
      w: SLIDE_W * 0.55,
      h: 0.7,
      fontFace: design.fontBody,
      fontSize: 18,
      color: design.textSecondary,
    });
  }
}
