import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle } from "../theme";

export function renderTable(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const table = content.table;
  if (!table || table.headers.length === 0) return;

  const headerRow: PptxGenJS.TableRow = table.headers.map((h) => ({
    text: h,
    options: {
      fill: { color: design.primary },
      color: design.background,
      bold: true,
      fontFace: design.fontBody,
      fontSize: 13,
      align: "left",
      valign: "middle",
    },
  }));

  const bodyRows: PptxGenJS.TableRow[] = table.rows.map((row) =>
    row.map((cell, colIdx) => ({
      text: cell,
      options: {
        fill: { color: colIdx === 0 ? design.surface : design.background },
        color: design.textPrimary,
        fontFace: design.fontBody,
        fontSize: 13,
        align: "left" as const,
        valign: "middle" as const,
        border: { type: "solid", color: design.surface, pt: 0.75 },
      },
    }))
  );

  slide.addTable([headerRow, ...bodyRows], {
    x: MARGIN,
    y: 2.0,
    w: SLIDE_W - MARGIN * 2,
    h: SLIDE_H - 2.0 - MARGIN,
    fontSize: 13,
    autoPage: false,
  });
}
