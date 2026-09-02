import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { MARGIN, SLIDE_H, SLIDE_W, addTitle, paintBackground } from "../theme";

export function renderVisual(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");
  const position = content.imagePosition ?? "right";
  const data = content.imageData;
  const imageX = position === "left" ? MARGIN : position === "full" ? MARGIN : 7.05;
  const imageY = position === "full" ? 1.65 : 1.72;
  const imageW = position === "full" ? SLIDE_W - MARGIN * 2 : 5.48;
  const imageH = position === "full" ? 4.72 : 4.78;

  if (data) {
    slide.addImage({ data, x: imageX, y: imageY, w: imageW, h: imageH });
  } else {
    slide.addShape("rect", {
      x: imageX, y: imageY, w: imageW, h: imageH,
      fill: { color: design.surface }, line: { color: design.primary, transparency: 65, width: 1 },
    });
    slide.addText("이미지 연결 필요", {
      x: imageX, y: imageY + imageH / 2 - 0.2, w: imageW, h: 0.4,
      align: "center", fontFace: design.fontBody, fontSize: 14, color: design.textSecondary, margin: 0,
    });
  }

  if (position !== "full") {
    const textX = position === "left" ? 6.65 : MARGIN;
    const bullets = content.bullets ?? [];
    slide.addText(bullets.map((text) => ({ text, options: { bullet: { characterCode: "25AA", indent: 18 }, breakLine: true, paraSpaceAfter: 16 } })), {
      x: textX, y: 2.0, w: 5.65, h: 3.8, valign: "middle", margin: 0,
      fontFace: design.fontBody, fontSize: bullets.length <= 2 ? 23 : 18, color: design.textPrimary,
    });
  }
  if (content.imageCaption) {
    slide.addText(content.imageCaption, {
      x: imageX, y: Math.min(imageY + imageH + 0.12, SLIDE_H - 0.55), w: imageW, h: 0.28,
      fontFace: design.fontBody, fontSize: 9, color: design.textSecondary, italic: true, margin: 0,
    });
  }
}
