import { Brief, InstitutionClassification, SlideContent, SlideLayout } from "../types";
import { ResearchResult } from "../research";
import { buildSections } from "./toc";

const CYCLE: SlideLayout[] = ["bullets", "table", "stats", "process", "compare"];

/**
 * Deterministic slide content used when no ANTHROPIC_API_KEY is configured (or the LLM call
 * fails). Content is keyed to each section's own title (not one repeated block) so a deck
 * without AI still reads as section-specific rather than a template stamped out five times.
 */
export function buildFallbackSlides(input: {
  brief: Brief;
  classification: InstitutionClassification;
  research: ResearchResult | null;
}): SlideContent[] {
  const { brief, classification, research } = input;
  const sections = buildSections(brief.docType, classification.type);
  const slides: SlideContent[] = [];

  slides.push({
    layout: "cover",
    title: brief.topic,
    subtitle: `${brief.institutionName} · ${classification.label}`,
  });

  sections.forEach((section, i) => {
    const layout = CYCLE[i % CYCLE.length];
    const base: SlideContent = { layout, title: section };

    if (layout === "bullets") {
      base.bullets = [
        `${section} 관점에서 본 ${brief.topic} [기관 확인 필요]`,
        brief.audience ? `대상: ${brief.audience}` : "대상: [직접 입력]",
        brief.mustInclude ? `반드시 포함: ${brief.mustInclude}` : `${brief.institutionName} 상황에 맞춰 구체화할 부분이에요.`,
        research?.summary ?? "AI 키를 연결하면 이 부분이 실제 내용으로 자동 채워져요.",
      ];
    } else if (layout === "table") {
      base.table = {
        headers: ["항목", "내용"],
        rows: [
          ["대상", brief.audience ?? "[직접 입력]"],
          ["시간", brief.durationMinutes ? `${brief.durationMinutes}분` : "[직접 입력]"],
          ["주제", brief.topic],
          ["관련 섹션", section],
        ],
      };
    } else if (layout === "stats") {
      base.stats = [
        { value: "90%", label: "수료율 목표" },
        { value: "80%", label: "결과물 완성률" },
        { value: "4.5/5", label: "만족도 목표" },
      ];
    } else if (layout === "process") {
      base.steps = [
        { title: "도입", description: `${section} 관련 목표와 활용 사례를 공유해요.` },
        { title: "실습", description: `${brief.topic} 핵심 내용을 직접 실습해요.` },
        { title: "정리", description: "결과물을 점검하고 다음 단계를 안내해요." },
      ];
    } else if (layout === "compare") {
      base.columns = [
        {
          title: "현재 상태",
          items: [`${section} 관련 현황 [기관 확인 필요]`, "구체적인 문제점은 [직접 입력]"],
        },
        {
          title: `${brief.topic} 적용 후`,
          items: [`${section}이(가) 개선된 모습 [기관 확인 필요]`, "기대 효과는 [직접 입력]"],
        },
      ];
    }

    slides.push(base);
  });

  slides.push({
    layout: "closing",
    title: "감사합니다",
    subtitle: brief.contact ?? brief.presenterName ?? brief.institutionName,
  });

  return slides;
}
