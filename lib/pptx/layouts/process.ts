import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, shapeType, paintBackground, addTitle } from "../theme";

export function renderProcess(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");

  const steps = content.steps ?? [];
  if (steps.length === 0) return;

  const top = 2.3;
  const bottom = SLIDE_H - MARGIN;
  const gap = 0.3;
  const totalW = SLIDE_W - MARGIN * 2;
  const boxW = (totalW - gap * (steps.length - 1)) / steps.length;
  const badgeD = 0.5;

  steps.forEach((step, i) => {
    const x = MARGIN + i * (boxW + gap);

    slide.addShape("ellipse", {
      x: x + boxW / 2 - badgeD / 2,
      y: top,
      w: badgeD,
      h: badgeD,
      fill: { color: design.primary },
      line: { type: "none" },
    });
    slide.addText(String(i + 1), {
      x: x + boxW / 2 - badgeD / 2,
      y: top,
      w: badgeD,
      h: badgeD,
      align: "center",
      valign: "middle",
      fontFace: design.fontHeading,
      fontSize: 18,
      bold: true,
      color: design.background,
    });

    if (i < steps.length - 1) {
      slide.addShape("line", {
        x: x + boxW / 2 + badgeD / 2 + 0.1,
        y: top + badgeD / 2,
        w: boxW + gap - badgeD - 0.2,
        h: 0,
        line: { color: design.textSecondary, width: 1, dashType: "dash" },
      });
    }

    slide.addShape(shapeType(design), {
      x,
      y: top + badgeD + 0.25,
      w: boxW,
      h: bottom - top - badgeD - 0.25,
      fill: { color: design.surface },
      line: { type: "none" },
      rectRadius: design.shapeLanguage === "rounded" ? 0.1 : undefined,
    });
    slide.addText(step.title, {
      x: x + 0.15,
      y: top + badgeD + 0.4,
      w: boxW - 0.3,
      h: 0.5,
      fontFace: design.fontHeading,
      fontSize: 15,
      bold: true,
      color: design.textPrimary,
      align: "center",
    });
    slide.addText(step.description, {
      x: x + 0.15,
      y: top + badgeD + 0.95,
      w: boxW - 0.3,
      h: bottom - (top + badgeD + 0.95),
      fontFace: design.fontBody,
      fontSize: 12,
      color: design.textSecondary,
      align: "center",
      valign: "top",
    });
  });
}
