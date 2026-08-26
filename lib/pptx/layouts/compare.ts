import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, shapeType, paintBackground, addTitle } from "../theme";

export function renderCompare(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const columns = content.columns ?? [];
  if (columns.length === 0) return;

  const top = 1.85;
  const bottom = SLIDE_H - MARGIN;
  const gap = 0.35;
  const totalW = SLIDE_W - MARGIN * 2;
  const colW = (totalW - gap * (columns.length - 1)) / columns.length;

  columns.forEach((col, i) => {
    const x = MARGIN + i * (colW + gap);
    slide.addShape(shapeType(design), {
      x,
      y: top,
      w: colW,
      h: bottom - top,
      fill: { color: design.surface },
      line: { type: "none" },
      rectRadius: design.shapeLanguage === "rounded" ? 0.12 : undefined,
    });
    slide.addText(col.title, {
      x: x + 0.25,
      y: top + 0.2,
      w: colW - 0.5,
      h: 0.6,
      fontFace: design.fontHeading,
      fontSize: 18,
      bold: true,
      color: design.primary,
      isTextBox: true,
      margin: 0,
    });
    slide.addText(
      col.items.map((text) => ({
        text,
        options: { bullet: { characterCode: "2022", indent: 16 }, breakLine: true, paraSpaceAfter: 10 },
      })),
      {
        x: x + 0.25,
        y: top + 0.9,
        w: colW - 0.5,
        h: bottom - top - 1.1,
        fontFace: design.fontBody,
        fontSize: 15,
        color: design.textPrimary,
        valign: "top",
        isTextBox: true,
        margin: 0,
      }
    );
  });
}
