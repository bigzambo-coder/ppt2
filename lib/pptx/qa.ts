import { QAIssue, QAReport, SlideContent } from "../types";

/**
 * Mirrors the production rules in the master spec (PART 10 / §48): layout variety,
 * no 3-consecutive-identical layouts, and reasonably sized bullet lists.
 */
export function runQa(slides: SlideContent[]): QAReport {
  const issues: QAIssue[] = [];

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

  slides.forEach((slide, i) => {
    if (slide.bullets && slide.bullets.length > 6) {
      issues.push({
        severity: "warning",
        message: `${i + 1}번 슬라이드 불릿이 ${slide.bullets.length}개로 너무 많아요 (5개 이하 권장).`,
        slideIndex: i,
      });
    }
    if (slide.layout === "table" && (!slide.table || slide.table.rows.length === 0)) {
      issues.push({ severity: "warning", message: `${i + 1}번 슬라이드 표에 내용이 없어요.`, slideIndex: i });
    }
    if (slide.layout === "stats" && (!slide.stats || slide.stats.length === 0)) {
      issues.push({ severity: "warning", message: `${i + 1}번 슬라이드 통계 항목이 없어요.`, slideIndex: i });
    }
  });

  const passed = !issues.some((i) => i.severity === "error");
  return { passed, issues };
}
