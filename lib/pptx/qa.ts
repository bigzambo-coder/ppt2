import { QAIssue, QAReport, ResearchSource, SlideContent } from "../types";
import { validateSlideContract } from "../content/slide-contract";

/**
 * Phrases that signal the writer padded a slide instead of saying something.
 * These are the exact shapes of filler seen in the decks this app is meant to
 * replace — a slide whose body is one of these is worse than an empty slide,
 * because it looks finished.
 */
const BOILERPLATE = [
  /필요한 핵심 내용과 적용 사례를 설명합니다/,
  /에 대해 알아봅[니다다]/,
  /중요성을 이해합니다/,
  /효율적으로 개선합니다/,
  /핵심 내용을 한눈에 정리합니다/,
  /검증할 근거와 인터뷰 내용을 이 영역에 배치합니다/,
];

/** Every user-visible string on a slide, for repetition and filler checks. */
function textOf(slide: SlideContent): string[] {
  const out: string[] = [];
  if (slide.title) out.push(slide.title);
  if (slide.subtitle) out.push(slide.subtitle);
  out.push(...(slide.bullets ?? []));
  for (const c of slide.columns ?? []) out.push(c.title, ...c.items);
  for (const s of slide.steps ?? []) out.push(s.title, s.description);
  for (const s of slide.stats ?? []) out.push(s.label);
  for (const c of slide.cards ?? []) out.push(c.title, c.description);
  for (const m of slide.milestones ?? []) out.push(m.what);
  if (slide.profile) out.push(slide.profile.detail);
  if (slide.imageCaption) out.push(slide.imageCaption);
  if (slide.chartInsight) out.push(slide.chartInsight);
  if (slide.quote) out.push(slide.quote);
  for (const row of slide.table?.rows ?? []) out.push(...row);
  return out.filter((s) => typeof s === "string" && s.trim().length > 0);
}

/** True when the layout's own required data is missing — an empty shell slide. */
function isEmpty(slide: SlideContent): boolean {
  switch (slide.layout) {
    case "bullets":
      return !slide.bullets?.length;
    case "agenda":
      return !slide.milestones?.length;
    case "compare":
      return !slide.columns?.length;
    case "process":
      return !slide.steps?.length;
    case "stats":
      return !slide.stats?.length;
    case "table":
      return !slide.table?.rows?.length;
    case "cards":
      return !slide.cards?.length;
    case "timeline":
      return !slide.milestones?.length;
    case "profile":
      return !slide.profile;
    case "quote":
      return !slide.quote;
    case "visual":
      return !slide.imageUrl;
    case "chart":
      return (slide.chartData?.length ?? 0) < 2;
    default:
      return false;
  }
}

export function runQa(slides: SlideContent[], sources: ResearchSource[] = []): QAReport {
  const issues: QAIssue[] = [];

  // --- Layout rhythm ------------------------------------------------------
  let streak = 1;
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].layout === slides[i - 1].layout) {
      streak++;
      if (streak >= 3) {
        issues.push({
          severity: "error",
          message: `"${slides[i].layout}" 레이아웃이 3장 연속 사용됐어요.`,
          slideIndex: i,
        });
      }
    } else {
      streak = 1;
    }
  }

  const distinctLayouts = new Set(slides.map((s) => s.layout)).size;
  const minVariety = Math.max(4, Math.round((6 / 15) * slides.length));
  if (slides.length >= 8 && distinctLayouts < minVariety) {
    issues.push({
      severity: "warning",
      message: `레이아웃 종류가 ${distinctLayouts}개뿐이에요 (최소 ${minVariety}개 권장).`,
    });
  }

  const visualLayouts = new Set(["agenda", "visual", "chart", "compare", "process", "stats", "table", "timeline", "cards"]);
  const visualCount = slides.filter((s) => visualLayouts.has(s.layout)).length;
  if (slides.length >= 10 && visualCount / slides.length < 0.45) {
    issues.push({ severity: "warning", message: `시각 중심 슬라이드가 ${visualCount}/${slides.length}장뿐이에요 (45% 이상 권장).` });
  }

  let textOnlyStreak = 0;
  slides.forEach((slide, i) => {
    issues.push(...validateSlideContract(slide, i));
    if (["bullets", "quote"].includes(slide.layout)) {
      textOnlyStreak++;
      if (textOnlyStreak >= 3) issues.push({ severity: "error", message: "글 중심 슬라이드가 3장 연속 배치됐어요.", slideIndex: i });
    } else {
      textOnlyStreak = 0;
    }
  });

  // --- Per-slide content --------------------------------------------------
  const seen = new Map<string, number>();

  slides.forEach((slide, i) => {
    if (isEmpty(slide)) {
      issues.push({ severity: "warning", message: `${i + 1}번 슬라이드가 비어 있어요.`, slideIndex: i });
    }
    if (slide.bullets && slide.bullets.length > 6) {
      issues.push({
        severity: "warning",
        message: `${i + 1}번 슬라이드 불릿이 ${slide.bullets.length}개로 너무 많아요 (5개 이하 권장).`,
        slideIndex: i,
      });
    }

    for (const text of textOf(slide)) {
      if (BOILERPLATE.some((re) => re.test(text))) {
        issues.push({
          severity: "error",
          message: `${i + 1}번 슬라이드에 내용 없는 상투적 문장이 있어요: "${text.slice(0, 30)}…"`,
          slideIndex: i,
        });
        break;
      }
    }

    // Repetition across slides — the failure mode where only the title changes.
    for (const text of textOf(slide)) {
      const key = text.trim();
      if (key.length < 12) continue;
      const first = seen.get(key);
      if (first !== undefined && first !== i) {
        issues.push({
          severity: "warning",
          message: `${first + 1}번과 ${i + 1}번 슬라이드에 똑같은 문장이 반복돼요: "${key.slice(0, 30)}…"`,
          slideIndex: i,
        });
        break;
      }
      seen.set(key, i);
    }
  });

  // --- Sources ------------------------------------------------------------
  const sourceIds = new Set(sources.map((s) => s.id));
  let citedCount = 0;
  slides.forEach((slide, i) => {
    if (!slide.sources || slide.sources.length === 0) return;
    citedCount++;
    for (const id of slide.sources) {
      if (!sourceIds.has(id)) {
        issues.push({
          severity: "error",
          message: `${i + 1}번 슬라이드가 존재하지 않는 출처(${id})를 인용했어요.`,
          slideIndex: i,
        });
      }
    }
  });

  if (sources.length > 0 && citedCount === 0) {
    issues.push({
      severity: "warning",
      message: `조사한 출처가 ${sources.length}건 있는데 어떤 슬라이드에도 인용되지 않았어요.`,
    });
  }

  // --- Unfilled placeholders ---------------------------------------------
  const placeholderSlides = slides.filter((s) => textOf(s).some((t) => t.includes("[확인 필요]"))).length;
  if (placeholderSlides > 0) {
    issues.push({
      severity: "warning",
      message: `${placeholderSlides}개 슬라이드에 [확인 필요] 표시가 있어요. 미리보기에서 실제 내용으로 채워 주세요.`,
    });
  }

  return { passed: !issues.some((i) => i.severity === "error"), issues };
}
