import type PptxGenJS from "pptxgenjs";
import { DesignToken } from "../types";

export const SLIDE_W = 13.33;
export const SLIDE_H = 7.5;
export const MARGIN = 0.6;

export function shapeType(design: DesignToken): "rect" | "roundRect" {
  return design.shapeLanguage === "sharp" ? "rect" : "roundRect";
}

/** Fills the slide background and drops a thin primary-color accent bar down the left edge. */
export function paintBackground(slide: PptxGenJS.Slide, design: DesignToken): void {
  slide.background = { color: design.background };
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.18,
    h: SLIDE_H,
    fill: { color: design.primary },
    line: { type: "none" },
  });
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
  });
}

export function addTitle(
  slide: PptxGenJS.Slide,
  design: DesignToken,
  title: string,
  y = 0.85,
  fontSize = 28
): void {
  slide.addText(title, {
    x: MARGIN,
    y,
    w: SLIDE_W - MARGIN * 2,
    h: 0.9,
    fontFace: design.fontHeading,
    fontSize,
    color: design.textPrimary,
    bold: true,
  });
}

export function addSubtitle(slide: PptxGenJS.Slide, design: DesignToken, subtitle: string, y = 1.65): void {
  slide.addText(subtitle, {
    x: MARGIN,
    y,
    w: SLIDE_W - MARGIN * 2,
    h: 0.5,
    fontFace: design.fontBody,
    fontSize: 16,
    color: design.textSecondary,
  });
}
