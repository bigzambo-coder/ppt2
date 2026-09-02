import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle } from "../theme";

/**
 * One person: 강사 소개, 대표 인사말, 팀 리드. A monogram disc stands in for a
 * photo — we never have an uploaded portrait at render time, and an empty image
 * frame reads worse than a deliberate typographic mark.
 */
export function renderProfile(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const person = content.profile;
  if (!person) return;

  const top = 2.3;
  const discD = 2.0;
  const discX = MARGIN + 0.4;
  const textX = discX + discD + 0.8;

  slide.addShape("ellipse", {
    x: discX,
    y: top,
    w: discD,
    h: discD,
    fill: { color: design.primary },
    line: { type: "none" },
  });
  slide.addText((person.name || "?").trim().charAt(0), {
    x: discX,
    y: top,
    w: discD,
    h: discD,
    align: "center",
    valign: "middle",
    fontFace: design.fontHeading,
    fontSize: 72,
    bold: true,
    color: design.background,
    isTextBox: true,
    margin: 0,
  });

  slide.addText(person.name, {
    x: textX,
    y: top + 0.15,
    w: SLIDE_W - MARGIN - textX,
    h: 0.75,
    fontFace: design.fontHeading,
    fontSize: 32,
    bold: true,
    color: design.textPrimary,
    valign: "bottom",
    isTextBox: true,
    margin: 0,
  });
  slide.addText(person.role, {
    x: textX,
    y: top + 0.95,
    w: SLIDE_W - MARGIN - textX,
    h: 0.45,
    fontFace: design.fontBody,
    fontSize: 16,
    color: design.primary,
    isTextBox: true,
    margin: 0,
  });
  slide.addShape("rect", {
    x: textX,
    y: top + 1.5,
    w: 0.6,
    h: 0.04,
    fill: { color: design.accent[0] ?? design.primary },
    line: { type: "none" },
  });
  slide.addText(person.detail, {
    x: textX,
    y: top + 1.75,
    w: SLIDE_W - MARGIN - textX,
    h: SLIDE_H - MARGIN - (top + 1.75),
    fontFace: design.fontBody,
    fontSize: 14,
    color: design.textSecondary,
    valign: "top",
    isTextBox: true,
    margin: 0,
  });
}
