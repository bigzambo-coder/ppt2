import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, paintBackground } from "../theme";

export function renderQuote(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);

  const marginX = 1.3;
  slide.addText(`" ${content.quote ?? ""} "`, {
    x: marginX,
    y: SLIDE_H / 2 - 1.3,
    w: SLIDE_W - marginX * 2,
    h: 2.0,
    align: "center",
    valign: "middle",
    fontFace: design.fontHeading,
    fontSize: 26,
    italic: true,
    color: design.textPrimary,
  });

  if (content.quoteAttribution) {
    slide.addText(`— ${content.quoteAttribution}`, {
      x: marginX,
      y: SLIDE_H / 2 + 0.8,
      w: SLIDE_W - marginX * 2,
      h: 0.5,
      align: "center",
      fontFace: design.fontBody,
      fontSize: 15,
      color: design.textSecondary,
    });
  }
}
