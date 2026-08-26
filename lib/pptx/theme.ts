import type PptxGenJS from "pptxgenjs";
import { DesignToken } from "../types";

export const SLIDE_W = 13.33;
export const SLIDE_H = 7.5;
export const MARGIN = 0.6;

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
  slide.addShape("ellipse", {
    x: MARGIN,
    y: y + fontSize / 144,
    w: TITLE_BADGE_D,
    h: TITLE_BADGE_D,
    fill: { color: design.primary },
    line: { type: "none" },
  });
  slide.addText(title, {
    x: MARGIN + TITLE_BADGE_D + 0.2,
    y,
    w: SLIDE_W - MARGIN * 2 - TITLE_BADGE_D - 0.2,
    h: 0.7,
    fontFace: design.fontHeading,
    fontSize,
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
