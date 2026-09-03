import { QAIssue, SlideContent } from "../types";

/** Content contract adapted from ppt-template-kit/SCHEMA.md. */
export const SLIDE_LIMITS = {
  title: 28, subtitle: 80, bullet: 45, bulletCount: 5,
  cardTitle: 20, cardBody: 70, cardCount: 3,
  processTitle: 16, processBody: 30, processCount: 5,
  agendaCount: 6, tableColumns: 5, tableRows: 8, chartPoints: 6,
} as const;

function clip(value: string | undefined, max: number): string | undefined {
  if (!value) return value;
  const chars = Array.from(value.trim());
  return chars.length <= max ? chars.join("") : `${chars.slice(0, Math.max(1, max - 1)).join("")}…`;
}

/** Safe deterministic cleanup before preview/export. Never invents content. */
export function normalizeSlide(slide: SlideContent): SlideContent {
  const normalized: SlideContent = { ...slide, title: clip(slide.title, SLIDE_LIMITS.title), subtitle: clip(slide.subtitle, SLIDE_LIMITS.subtitle) };
  if (slide.bullets) normalized.bullets = slide.bullets.slice(0, SLIDE_LIMITS.bulletCount).map((v) => clip(v, SLIDE_LIMITS.bullet) ?? "");
  if (slide.cards) normalized.cards = slide.cards.slice(0, SLIDE_LIMITS.cardCount).map((c) => ({ title: clip(c.title, SLIDE_LIMITS.cardTitle) ?? "", description: clip(c.description, SLIDE_LIMITS.cardBody) ?? "" }));
  if (slide.steps) normalized.steps = slide.steps.slice(0, SLIDE_LIMITS.processCount).map((s) => ({ title: clip(s.title, SLIDE_LIMITS.processTitle) ?? "", description: clip(s.description, SLIDE_LIMITS.processBody) ?? "" }));
  if (slide.milestones) normalized.milestones = slide.milestones.slice(0, slide.layout === "agenda" ? SLIDE_LIMITS.agendaCount : 8).map((m) => ({ when: clip(m.when, 12) ?? "", what: clip(m.what, 46) ?? "" }));
  if (slide.table) {
    const headers = slide.table.headers.slice(0, SLIDE_LIMITS.tableColumns).map((v) => clip(v, 24) ?? "");
    normalized.table = { headers, rows: slide.table.rows.slice(0, SLIDE_LIMITS.tableRows).map((row) => headers.map((_, i) => clip(row[i] ?? "", 44) ?? "")) };
  }
  if (slide.chartData) normalized.chartData = slide.chartData.filter((d) => Number.isFinite(d.value)).slice(0, SLIDE_LIMITS.chartPoints).map((d) => ({ label: clip(d.label, 18) ?? "", value: d.value }));
  return normalized;
}

export function normalizeDeckSlides(slides: SlideContent[]): SlideContent[] { return slides.map(normalizeSlide); }

export function validateSlideContract(slide: SlideContent, slideIndex: number): QAIssue[] {
  const issues: QAIssue[] = [];
  const issue = (severity: "warning" | "error", message: string) => issues.push({ severity, message: `${slideIndex + 1}번: ${message}`, slideIndex });
  if (!slide.title?.trim() && slide.layout !== "quote") issue("error", "제목이 비어 있어요.");
  if ((slide.title?.length ?? 0) > SLIDE_LIMITS.title) issue("warning", `제목이 ${SLIDE_LIMITS.title}자를 넘어요.`);
  switch (slide.layout) {
    case "agenda": if ((slide.milestones?.length ?? 0) < 2 || (slide.milestones?.length ?? 0) > SLIDE_LIMITS.agendaCount) issue("error", "목차는 2~6개 구간이어야 해요."); break;
    case "bullets": if ((slide.bullets?.length ?? 0) < 3 || (slide.bullets?.length ?? 0) > SLIDE_LIMITS.bulletCount) issue("warning", "목록은 3~5개 항목이 가장 읽기 좋아요."); break;
    case "cards": if ((slide.cards?.length ?? 0) !== SLIDE_LIMITS.cardCount) issue("warning", "카드 구성은 3개로 맞추는 것이 안정적이에요."); break;
    case "process": if ((slide.steps?.length ?? 0) < 3 || (slide.steps?.length ?? 0) > SLIDE_LIMITS.processCount) issue("error", "과정은 3~5단계여야 해요."); break;
    case "table": {
      const cols = slide.table?.headers.length ?? 0;
      if (cols < 2 || cols > SLIDE_LIMITS.tableColumns) issue("error", "표는 2~5열이어야 해요.");
      if ((slide.table?.rows.length ?? 0) > SLIDE_LIMITS.tableRows) issue("error", "표는 8행 이하여야 해요.");
      if (slide.table?.rows.some((r) => r.length !== cols)) issue("error", "표의 모든 행은 머리글과 열 수가 같아야 해요.");
      break;
    }
    case "chart": if ((slide.chartData?.length ?? 0) < 2 || (slide.chartData?.length ?? 0) > SLIDE_LIMITS.chartPoints) issue("error", "그래프는 실제 숫자 2~6개가 필요해요."); break;
  }
  return issues;
}
