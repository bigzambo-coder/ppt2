import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, MARGIN, paintBackground, addTitle, addSubtitle } from "../theme";

export function renderBullets(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");
  const listY = content.subtitle ? 2.3 : 1.7;
  if (content.subtitle) addSubtitle(slide, design, content.subtitle);

  const bullets = content.bullets ?? [];
  slide.addText(
    bullets.map((text) => ({
      text,
      options: { bullet: { characterCode: "25CF", indent: 20 }, breakLine: true, paraSpaceAfter: 16 },
    })),
    {
      x: MARGIN,
      y: listY,
      w: SLIDE_W - MARGIN * 2,
      h: 7.5 - listY - MARGIN,
      fontFace: design.fontBody,
      fontSize: 19,
      color: design.textPrimary,
      valign: "top",
      isTextBox: true,
      margin: 0,
    }
  );
}
