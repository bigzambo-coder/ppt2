import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { SLIDE_W, SLIDE_H, MARGIN, paintBackground, addTitle, addSubtitle } from "../theme";

/**
 * Body type scales with how much there is to say. A fixed size left a two-bullet
 * slide as a small block of text pinned to the top of an otherwise empty 16:9
 * frame — the single biggest reason generated decks looked unfinished.
 */
function bodySize(count: number): number {
  if (count <= 2) return 27;
  if (count === 3) return 23;
  if (count === 4) return 21;
  return 18;
}

export function renderBullets(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");
  const listY = content.subtitle ? 2.3 : 1.8;
  if (content.subtitle) addSubtitle(slide, design, content.subtitle);

  const bullets = content.bullets ?? [];
  if (bullets.length === 0) return;

  const fontSize = bodySize(bullets.length);

  slide.addText(
    bullets.map((text) => ({
      text,
      options: {
        // 25AA (small filled square) reads as a quiet marker; the old 25CF circle
        // at body size competed with the text it was supposed to introduce.
        bullet: { characterCode: "25AA", indent: 22 },
        breakLine: true,
        paraSpaceAfter: Math.round(fontSize * 0.8),
      },
    })),
    {
      x: MARGIN,
      y: listY,
      w: SLIDE_W - MARGIN * 2,
      h: SLIDE_H - listY - MARGIN,
      fontFace: design.fontBody,
      fontSize,
      color: design.textPrimary,
      // Centered in the content area, so a short list sits in the middle of the
      // slide rather than clinging to the top edge.
      valign: "middle",
      lineSpacingMultiple: 1.25,
      isTextBox: true,
      margin: 0,
    }
  );
}
