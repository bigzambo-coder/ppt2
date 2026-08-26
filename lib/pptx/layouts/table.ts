import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, MARGIN, paintBackground, addTitle } from "../theme";

const ROW_H = 0.62;

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
      fontSize: 14,
      align: "left",
      valign: "middle",
      margin: [0.06, 0.12, 0.06, 0.12],
    },
  }));

  const bodyRows: PptxGenJS.TableRow[] = table.rows.map((row) =>
    row.map((cell, colIdx) => ({
      text: cell,
      options: {
        fill: { color: colIdx === 0 ? design.surface : design.background },
        color: design.textPrimary,
        fontFace: design.fontBody,
        fontSize: 14,
        align: "left" as const,
        valign: "middle" as const,
        border: { type: "solid", color: design.surface, pt: 0.75 },
        margin: [0.06, 0.12, 0.06, 0.12],
      },
    }))
  );

  // Fixed per-row height instead of stretching the table to fill the slide — a short table
  // (3-4 rows) forced to fill ~5" of remaining page height is what made rows look bloated.
  slide.addTable([headerRow, ...bodyRows], {
    x: MARGIN,
    y: 1.9,
    w: SLIDE_W - MARGIN * 2,
    rowH: ROW_H,
    fontSize: 14,
    autoPage: false,
  });
}
