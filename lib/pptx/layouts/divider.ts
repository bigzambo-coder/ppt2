import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H } from "../theme";

const MARGIN_X = 0.9;

export function renderDivider(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  slide.background = { color: design.primary };

  const badgeD = 0.5;
  slide.addShape("ellipse", {
    x: MARGIN_X,
    y: SLIDE_H / 2 - 1.5,
    w: badgeD,
    h: badgeD,
    fill: { color: design.accent[0] ?? design.background },
    line: { type: "none" },
  });

  slide.addText(content.title ?? "", {
    x: MARGIN_X,
    y: SLIDE_H / 2 - 0.9,
    w: SLIDE_W - MARGIN_X * 2,
    h: 1.5,
    fontFace: design.fontHeading,
    fontSize: 36,
    bold: true,
    color: design.background,
    isTextBox: true,
    margin: 0,
  });

  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: MARGIN_X,
      y: SLIDE_H / 2 + 0.9,
      w: SLIDE_W - MARGIN_X * 2,
      h: 0.6,
      fontFace: design.fontBody,
      fontSize: 16,
      color: design.background,
      isTextBox: true,
      margin: 0,
    });
  }
}
