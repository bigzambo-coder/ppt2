import PptxGenJS from "pptxgenjs";
import { DesignToken, ResearchSource, SlideContent, SlideLayout } from "../types";
import { addPageNumber } from "./theme";
import { renderCover } from "./layouts/cover";
import { renderDivider } from "./layouts/divider";
import { renderBullets } from "./layouts/bullets";
import { renderCompare } from "./layouts/compare";
import { renderProcess } from "./layouts/process";
import { renderStats } from "./layouts/stats";
import { renderTable } from "./layouts/table";
import { renderQuote } from "./layouts/quote";
import { renderTimeline } from "./layouts/timeline";
import { renderCards } from "./layouts/cards";
import { renderProfile } from "./layouts/profile";
import { renderClosing } from "./layouts/closing";
import { renderVisual } from "./layouts/visual";
import { renderChart } from "./layouts/chart";
import { renderAgenda } from "./layouts/agenda";

const RENDERERS: Record<SlideLayout, (slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken) => void> = {
  cover: renderCover,
  agenda: renderAgenda,
  divider: renderDivider,
  bullets: renderBullets,
  compare: renderCompare,
  process: renderProcess,
  stats: renderStats,
  table: renderTable,
  quote: renderQuote,
  timeline: renderTimeline,
  cards: renderCards,
  profile: renderProfile,
  visual: renderVisual,
  chart: renderChart,
  closing: renderClosing,
};

async function resolveSlideImages(slides: SlideContent[]): Promise<SlideContent[]> {
  return Promise.all(slides.map(async (slide) => {
    if (slide.layout !== "visual" || !slide.imageUrl || slide.imageData) return slide;
    try {
      const url = new URL(slide.imageUrl);
      if (!/^https?:$/.test(url.protocol)) return slide;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (ppt-auto-bot)" } });
      clearTimeout(timer);
      if (!res.ok) return slide;
      const type = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
      if (!type.startsWith("image/")) return slide;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.byteLength > 12 * 1024 * 1024) return slide;
      return { ...slide, imageData: `data:${type};base64,${bytes.toString("base64")}` };
    } catch {
      return slide;
    }
  }));
}

export async function buildPptx(
  slides: SlideContent[],
  design: DesignToken,
  sources: ResearchSource[] = []
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PPT2_WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "PPT2_WIDE";
  pptx.author = "PPT 자동화 프로그램";

  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const resolvedSlides = await resolveSlideImages(slides);

  resolvedSlides.forEach((content, i) => {
    const slide = pptx.addSlide();
    const renderer = RENDERERS[content.layout] ?? renderBullets;
    renderer(slide, content, design);
    // Cover and closing are full-bleed statement slides; a page number on them
    // reads as clutter.
    if (content.layout !== "cover" && content.layout !== "closing") {
      addPageNumber(slide, design, i + 1);
    }

    const noteLines: string[] = [];
    if (content.notes) noteLines.push(content.notes);
    if (content.sources && content.sources.length > 0) {
      const cited = content.sources
        .map((id) => sourceById.get(id))
        .filter((s): s is ResearchSource => Boolean(s));
      if (cited.length > 0) {
        noteLines.push("출처: " + cited.map((s) => `${s.title}${s.url ? ` (${s.url})` : ""}`).join(" / "));
      }
    }
    if (noteLines.length > 0) slide.addNotes(noteLines.join("\n"));
  });

  const data = await pptx.write({ outputType: "nodebuffer" });
  return data as unknown as Buffer;
}
