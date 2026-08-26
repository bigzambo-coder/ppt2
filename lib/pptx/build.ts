import PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent, SlideLayout } from "../types";
import { renderCover } from "./layouts/cover";
import { renderDivider } from "./layouts/divider";
import { renderBullets } from "./layouts/bullets";
import { renderCompare } from "./layouts/compare";
import { renderProcess } from "./layouts/process";
import { renderStats } from "./layouts/stats";
import { renderTable } from "./layouts/table";
import { renderQuote } from "./layouts/quote";
import { renderClosing } from "./layouts/closing";

const RENDERERS: Record<SlideLayout, (slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken) => void> = {
  cover: renderCover,
  divider: renderDivider,
  bullets: renderBullets,
  compare: renderCompare,
  process: renderProcess,
  stats: renderStats,
  table: renderTable,
  quote: renderQuote,
  closing: renderClosing,
};

export async function buildPptx(slides: SlideContent[], design: DesignToken): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PPT2_WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "PPT2_WIDE";
  pptx.author = "PPT 자동화 프로그램";

  for (const content of slides) {
    const slide = pptx.addSlide();
    const renderer = RENDERERS[content.layout] ?? renderBullets;
    renderer(slide, content, design);
  }

  const data = await pptx.write({ outputType: "nodebuffer" });
  return data as unknown as Buffer;
}
