import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN } from "../theme";

/**
 * Editorial cover: a full-bleed color field on the right holding a single
 * keyword mark, with the title set large against generous white space on the
 * left and anchored by a rule.
 *
 * The previous version put a lime disc floating in the middle of a flat
 * rectangle with nothing else — a shape with no job, which is exactly what
 * makes a deck look auto-generated. Here every element earns its place: the
 * rule anchors the title block, the keyword names the deck, and the footer
 * carries the organisation and date.
 */
export function renderCover(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  slide.background = { color: design.background };
  const style = design.coverStyle ?? "split";
  const panelX = SLIDE_W * 0.63;
  const accent = design.accent[0] ?? design.primary;

  if (style === "poster") {
    slide.background = { color: design.primary };
    slide.addText("PRESENTATION / " + String(new Date().getFullYear()), {
      x: MARGIN, y: 0.55, w: 5.5, h: 0.3, fontFace: design.fontBody, fontSize: 11,
      bold: true, charSpacing: 2.4, color: accent, margin: 0,
    });
    slide.addText(content.title ?? "", {
      x: MARGIN, y: 1.45, w: SLIDE_W - MARGIN * 2, h: 3.6, fontFace: design.fontHeading,
      fontSize: 54, bold: true, color: design.background, breakLine: false, margin: 0,
      valign: "middle", lineSpacingMultiple: 0.95,
    });
    slide.addShape("rect", { x: MARGIN, y: 5.55, w: SLIDE_W - MARGIN * 2, h: 0.05, fill: { color: accent }, line: { type: "none" } });
    slide.addText(content.subtitle ?? "", { x: MARGIN, y: 5.85, w: 8.5, h: 0.5, fontFace: design.fontBody, fontSize: 16, color: design.background, margin: 0 });
    return;
  }

  if (style === "editorial") {
    slide.addText("01", { x: 9.6, y: 0.35, w: 2.8, h: 1.4, fontFace: design.fontHeading, fontSize: 68, bold: true, color: design.surface, align: "right", margin: 0 });
    slide.addText(content.title ?? "", { x: 1.15, y: 1.35, w: 9.2, h: 2.6, fontFace: design.fontHeading, fontSize: 50, bold: true, color: design.textPrimary, margin: 0, valign: "middle" });
    slide.addShape("rect", { x: 1.15, y: 4.45, w: 3.2, h: 0.09, fill: { color: accent }, line: { type: "none" } });
    slide.addText(content.subtitle ?? "", { x: 1.15, y: 5.05, w: 7.2, h: 0.55, fontFace: design.fontBody, fontSize: 17, color: design.textSecondary, margin: 0 });
    slide.addShape("rect", { x: 10.75, y: 1.65, w: 1.4, h: 4.9, fill: { color: design.primary }, line: { type: "none" } });
    return;
  }

  if (style === "frame") {
    slide.addShape("rect", { x: 0.42, y: 0.42, w: SLIDE_W - 0.84, h: SLIDE_H - 0.84, fill: { color: design.background, transparency: 100 }, line: { color: design.primary, width: 1.5 } });
    slide.addText("PROFESSIONAL DECK", { x: 0.85, y: 0.72, w: 3.8, h: 0.25, fontFace: design.fontBody, fontSize: 9, bold: true, charSpacing: 2.4, color: design.primary, margin: 0 });
    slide.addText(content.title ?? "", { x: 1.35, y: 2.05, w: 10.6, h: 2.05, fontFace: design.fontHeading, fontSize: 47, bold: true, color: design.textPrimary, align: "center", valign: "middle", margin: 0 });
    slide.addShape("rect", { x: 5.72, y: 4.45, w: 1.9, h: 0.07, fill: { color: accent }, line: { type: "none" } });
    slide.addText(content.subtitle ?? "", { x: 2.2, y: 5.1, w: 8.95, h: 0.45, fontFace: design.fontBody, fontSize: 15, color: design.textSecondary, align: "center", margin: 0 });
    return;
  }

  slide.addShape("rect", {
    x: panelX,
    y: 0,
    w: SLIDE_W - panelX,
    h: SLIDE_H,
    fill: { color: design.primary },
    line: { type: "none" },
  });

  // The year, set large and faded in the panel. An earlier version echoed the
  // title's first word here, which added nothing — the title is already on the
  // same slide. A date is editorial convention and carries real information.
  slide.addText(String(new Date().getFullYear()), {
    x: panelX,
    y: SLIDE_H / 2 - 1.2,
    w: SLIDE_W - panelX,
    h: 2.4,
    align: "center",
    valign: "middle",
    fontFace: design.fontHeading,
    fontSize: 54,
    bold: true,
    color: design.background,
    transparency: 55,
    isTextBox: true,
    margin: 0,
  });

  slide.addShape("rect", {
    x: panelX,
    y: SLIDE_H - 1.5,
    w: 1.6,
    h: 0.09,
    fill: { color: accent },
    line: { type: "none" },
  });

  // Left: rule, then title, then subtitle — a fixed vertical rhythm rather than
  // a block floated in the middle of empty space.
  slide.addShape("rect", {
    x: MARGIN,
    y: SLIDE_H * 0.34,
    w: 1.1,
    h: 0.1,
    fill: { color: accent },
    line: { type: "none" },
  });

  slide.addText(content.title ?? "", {
    x: MARGIN,
    y: SLIDE_H * 0.34 + 0.38,
    w: panelX - MARGIN - 0.7,
    h: 1.9,
    fontFace: design.fontHeading,
    fontSize: 40,
    bold: true,
    color: design.textPrimary,
    valign: "top",
    lineSpacingMultiple: 1.1,
    isTextBox: true,
    margin: 0,
  });

  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: MARGIN,
      y: SLIDE_H - 1.55,
      w: panelX - MARGIN - 0.7,
      h: 0.5,
      fontFace: design.fontBody,
      fontSize: 15,
      color: design.textSecondary,
      isTextBox: true,
      margin: 0,
    });
  }
}
