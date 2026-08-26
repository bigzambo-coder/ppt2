import { Brief, InstitutionClassification, SlideContent, SlideLayout } from "../types";
import { ResearchResult } from "../research";
import { buildSections } from "./toc";

const CYCLE: SlideLayout[] = ["bullets", "table", "stats", "process", "compare"];

/**
 * Deterministic slide content used when no ANTHROPIC_API_KEY is configured (or the LLM call
 * fails). Not as tailored as the AI path, but keeps the app fully usable without a key —
 * carried over from the prior project's defaultContent() safety net.
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
        `${brief.institutionName} 대상 ${brief.topic} 관련 내용 [기관 확인 필요]`,
        brief.audience ? `대상: ${brief.audience}` : "대상: [직접 입력]",
        research?.summary ? research.summary : "세부 내용은 브리프 입력 후 자동 생성돼요.",
      ];
    } else if (layout === "table") {
      base.table = {
        headers: ["항목", "내용"],
        rows: [
          ["대상", brief.audience ?? "[직접 입력]"],
          ["시간", brief.durationMinutes ? `${brief.durationMinutes}분` : "[직접 입력]"],
          ["주제", brief.topic],
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
        { title: "도입", description: "목표와 활용 사례 공유" },
        { title: "실습", description: `${brief.topic} 핵심 실습` },
        { title: "정리", description: "결과물 점검과 다음 단계 안내" },
      ];
    } else if (layout === "compare") {
      base.columns = [
        { title: "현재 상태", items: ["[기관 확인 필요]"] },
        { title: `${brief.topic} 적용 후`, items: ["[기관 확인 필요]"] },
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
