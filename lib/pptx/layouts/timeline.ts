import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle } from "../theme";

/**
 * Vertical timeline for 연혁 / 로드맵 / 추진일정 — a spine with a node per
 * milestone. Vertical rather than horizontal because Korean milestone text runs
 * long and would wrap badly in narrow horizontal columns.
 */
export function renderTimeline(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  // Up to 8: a 60분 agenda has one row per content block, and silently dropping
  // the tail meant the printed 진행 순서 ended before the session did.
  const milestones = (content.milestones ?? []).slice(0, 8);
  if (milestones.length === 0) return;

  const top = 2.0;
  const bottom = SLIDE_H - MARGIN;
  const rowH = (bottom - top) / milestones.length;
  const spineX = MARGIN + 1.9;
  const nodeD = milestones.length > 6 ? 0.16 : 0.2;
  const whenSize = milestones.length > 6 ? 14 : 17;
  const whatSize = milestones.length > 6 ? 13 : 15;

  slide.addShape("rect", {
    x: spineX - 0.01,
    y: top + rowH / 2,
    w: 0.02,
    h: Math.max(0, rowH * (milestones.length - 1)),
    fill: { color: design.textSecondary },
    line: { type: "none" },
  });

  milestones.forEach((m, i) => {
    const centerY = top + rowH * i + rowH / 2;
    const accent = design.accent[i % Math.max(design.accent.length, 1)] ?? design.primary;

    slide.addText(m.when, {
      x: MARGIN,
      y: centerY - 0.22,
      w: 1.7,
      h: 0.44,
      align: "right",
      valign: "middle",
      fontFace: design.fontHeading,
      fontSize: whenSize,
      bold: true,
      color: accent,
      isTextBox: true,
      margin: 0,
    });

    slide.addShape("ellipse", {
      x: spineX - nodeD / 2,
      y: centerY - nodeD / 2,
      w: nodeD,
      h: nodeD,
      fill: { color: accent },
      line: { color: design.background, width: 2 },
    });

    slide.addText(m.what, {
      x: spineX + 0.35,
      y: centerY - rowH / 2 + 0.06,
      w: SLIDE_W - MARGIN - spineX - 0.45,
      h: rowH - 0.12,
      valign: "middle",
      fontFace: design.fontBody,
      fontSize: whatSize,
      color: design.textPrimary,
      isTextBox: true,
      margin: 0,
    });
  });
}
