import type PptxGenJS from "pptxgenjs";
import { DesignToken } from "../types";

export const SLIDE_W = 13.33;
export const SLIDE_H = 7.5;
// 0.8" side margin per the SimpleP grid — the old 0.6" ran text close to the
// edge and was a big part of why slides read as unfinished.
export const MARGIN = 0.8;

/**
 * Page number, top-right, in muted type. Every professionally produced deck has
 * one and ours had none — its absence is one of those details that reads as
 * "unfinished" without the viewer being able to name why.
 */
export function addPageNumber(slide: PptxGenJS.Slide, design: DesignToken, n: number): void {
  slide.addText(String(n), {
    x: SLIDE_W - MARGIN - 0.6,
    y: 0.34,
    w: 0.6,
    h: 0.3,
    align: "right",
    fontFace: design.fontBody,
    fontSize: 11,
    color: design.textSecondary,
    isTextBox: true,
    margin: 0,
  });
}

export function shapeType(design: DesignToken): "rect" | "roundRect" {
  return design.shapeLanguage === "sharp" ? "rect" : "roundRect";
}

/**
 * Fills the slide background only — no sidebar stripe or accent bar. Repeated color-bar
 * decoration reads as AI-generated filler; the design's identity instead comes from the
 * small circle badge on every title (see addTitle) and the surface-tinted content cards.
 */
export function paintBackground(slide: PptxGenJS.Slide, design: DesignToken): void {
  slide.background = { color: design.background };
}

export function addKicker(slide: PptxGenJS.Slide, design: DesignToken, text: string): void {
  slide.addText(text.toUpperCase(), {
    x: MARGIN,
    y: 0.4,
    w: SLIDE_W - MARGIN * 2,
    h: 0.4,
    fontFace: design.fontBody,
    fontSize: 12,
    color: design.primary,
    bold: true,
    charSpacing: 2,
    isTextBox: true,
  });
}

const TITLE_BADGE_D = 0.16;

/** Slide heading with a small colored-circle badge — the deck's one repeated visual motif. */
export function addTitle(
  slide: PptxGenJS.Slide,
  design: DesignToken,
  title: string,
  y = 0.7,
  fontSize = 30
): void {
  const style = design.titleStyle ?? "rule";
  const offset = style === "badge" ? TITLE_BADGE_D + 0.2 : style === "block" ? 0.32 : 0;
  if (style === "badge") slide.addShape("ellipse", {
    x: MARGIN, y: y + fontSize / 144, w: TITLE_BADGE_D, h: TITLE_BADGE_D,
    fill: { color: design.primary }, line: { type: "none" },
  });
  if (style === "rule") slide.addShape("rect", {
    x: MARGIN, y: y - 0.22, w: 1.25, h: 0.06,
    fill: { color: design.accent[0] ?? design.primary }, line: { type: "none" },
  });
  if (style === "block") slide.addShape("rect", {
    x: MARGIN, y: y + 0.05, w: 0.12, h: 0.55,
    fill: { color: design.primary }, line: { type: "none" },
  });
  if (style === "index") slide.addText("INSIGHT", {
    x: MARGIN, y: y - 0.28, w: 1.5, h: 0.25, fontFace: design.fontBody,
    fontSize: 9, bold: true, charSpacing: 2.2, color: design.primary, margin: 0,
  });
  slide.addText(title, {
    x: MARGIN + offset,
    y,
    w: SLIDE_W - MARGIN * 2 - offset,
    h: 0.7,
    fontFace: design.fontHeading,
    fontSize: Math.max(fontSize, 34),
    color: design.textPrimary,
    bold: true,
    isTextBox: true,
    margin: 0,
  });
}

export function addSubtitle(slide: PptxGenJS.Slide, design: DesignToken, subtitle: string, y = 1.55): void {
  slide.addText(subtitle, {
    x: MARGIN,
    y,
    w: SLIDE_W - MARGIN * 2,
    h: 0.5,
    fontFace: design.fontBody,
    fontSize: 15,
    color: design.textSecondary,
    isTextBox: true,
  });
}
