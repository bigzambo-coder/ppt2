import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H } from "../theme";

export function renderClosing(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  slide.background = { color: design.primary };

  const badgeD = 0.6;
  slide.addShape("ellipse", {
    x: SLIDE_W / 2 - badgeD / 2,
    y: SLIDE_H / 2 - 1.85,
    w: badgeD,
    h: badgeD,
    fill: { color: design.accent[0] ?? design.background },
    line: { type: "none" },
  });

  slide.addText(content.title ?? "감사합니다", {
    x: 0.9,
    y: SLIDE_H / 2 - 1.0,
    w: SLIDE_W - 1.8,
    h: 1.3,
    align: "center",
    fontFace: design.fontHeading,
    fontSize: 34,
    bold: true,
    color: design.background,
    isTextBox: true,
  });

  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: 0.9,
      y: SLIDE_H / 2 + 0.4,
      w: SLIDE_W - 1.8,
      h: 0.6,
      align: "center",
      fontFace: design.fontBody,
      fontSize: 16,
      color: design.background,
      isTextBox: true,
    });
  }
}
