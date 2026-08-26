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
  const badgeD = 0.9;
  slide.addShape("ellipse", {
    x: SLIDE_W * 0.62 + (SLIDE_W * 0.38 - badgeD) / 2,
    y: SLIDE_H / 2 - badgeD / 2,
    w: badgeD,
    h: badgeD,
    fill: { color: design.accent[0] ?? design.background },
    line: { type: "none" },
  });

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
    isTextBox: true,
    margin: 0,
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
      isTextBox: true,
      margin: 0,
    });
  }
}
