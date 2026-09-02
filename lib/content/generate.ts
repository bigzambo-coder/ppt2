import { Brief, InstitutionClassification, ResearchSource, SlideContent } from "../types";
import { DocTypeSpec } from "../doctypes/spec";
import { generateOutlineWithLlm, generateSlidesWithLlm, hasLlm, OutlinePage } from "../anthropic";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { buildFallbackSlides } from "./fallback";
import { PlannedSlide, buildBlueprint } from "./blueprint";

export interface ContentResult {
  slides: SlideContent[];
  plan: PlannedSlide[];
  usedLlm: boolean;
  /** Set when the key exists but generation failed — never silently pretend there was no key. */
  llmError?: string;
}

/** Slides per API call. Keeps each response well inside max_tokens. */
const CHUNK_SIZE = 8;

const OUTLINE_SYSTEM = `너는 한국의 전문 프레젠테이션 전략가다. 고정 목차를 복사하지 말고 주제, 대상, 발표 목적, 시간에 맞춰 페이지별 서사를 먼저 설계한다.
- 각 페이지는 앞 장의 질문을 이어받고 다음 장의 필요성을 만든다.
- sectionTitle은 내부 분류명이 아니라 실제 주제에 맞는 구체적 장 제목으로 쓴다.
- 표지와 결론을 제외하고 같은 purpose나 동일한 제목을 반복하지 않는다.
- 강의는 대상의 사전지식과 시간에 맞춰 동기→개념→시연→실습→검증→적용 순서를 조정한다.
- 강의·교육 자료는 사용 가능 시간의 최소 40%를 참여자 실습에 배정한다. 한 개의 핵심 실습도 상황/목표 → 안전한 입력자료 → 복사 가능한 프롬프트 → 예상 결과 → 개선 → 사실·개인정보 검증의 4~6장으로 설계한다.
- 인터뷰에 최종 산출물이 있으면 모든 개념과 시연이 그 산출물을 완성하는 방향으로 누적되게 한다. 기기·계정 제약과 초보자의 로그인 실패를 위한 대체 화면/자료도 계획한다.
- 제안/보고/분석 자료는 주장→근거→의미→결정 또는 행동으로 이어지게 한다.
- 한 페이지에 하나의 주장만 둔다. 글 목록보다 사진, 실제 화면, 비교, 과정, 표, 그래프를 우선하되 장식은 금지한다.
- chart는 실제 숫자 근거가 있을 때만, visual은 제공된 imageUrl이 있을 때만 사용한다.
- 첫 장은 cover, 마지막 장은 closing이다. emit_outline 도구로만 응답한다.`;

function outlinePrompt(input: { brief: Brief; spec: DocTypeSpec; classification: InstitutionClassification; sources: ResearchSource[]; target: number; staticPlan: PlannedSlide[] }): string {
  const { brief, spec, classification, sources, target, staticPlan } = input;
  const fields = Object.entries(brief.fields).filter(([, v]) => String(v).trim()).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  const sourceLines = sources.slice(0, 8).map((s) => `- [${s.id}] ${s.title}: ${s.excerpt}${s.imageUrl ? ` / imageUrl=${s.imageUrl}` : ""}`).join("\n");
  const reference = staticPlan.map((p) => p.sectionTitle).join(" → ");
  return `# 요청\n- 문서 유형: ${spec.label}\n- 주제: ${brief.topic}\n- 대상: ${brief.audience ?? "일반 청중"}\n- 기관 분류: ${classification.label}\n- 발표 시간: ${brief.durationMinutes ?? "미지정"}분\n- 정확한 장수: ${target}장\n${fields}\n\n# 조사 출처\n${sourceLines || "검색된 출처 없음 — 외부 수치와 실제 사례를 만들지 말 것"}\n\n# 기존 유형 뼈대(참고만 하고 주제에 맞게 재구성)\n${reference}\n\n정확히 ${target}개의 pages를 만든다. 주제에 맞는 세부 소주제, 페이지 역할, 시각자료, 필요 근거를 장마다 다르게 설계한다.`;
}

function normalizeOutline(pages: OutlinePage[] | null, fallback: PlannedSlide[], sources: ResearchSource[], brief: Brief): PlannedSlide[] {
  if (!pages || pages.length !== fallback.length) return fallback;
  const hasImages = sources.some((s) => Boolean(s.imageUrl));
  const hasNumbers = sources.some((s) => /\d/.test(s.excerpt)) || Object.values(brief.fields).some((v) => /\d/.test(v));
  const counts = new Map<string, number>();
  pages.forEach((p) => counts.set(p.sectionId, (counts.get(p.sectionId) ?? 0) + 1));
  const seen = new Map<string, number>();
  return pages.map((p, i) => {
    let layout = p.layout;
    if (i === 0) layout = "cover";
    else if (i === pages.length - 1) layout = "closing";
    else if (layout === "visual" && !hasImages) layout = "process";
    else if (layout === "chart" && !hasNumbers) layout = "compare";
    const nth = (seen.get(p.sectionId) ?? 0) + 1;
    seen.set(p.sectionId, nth);
    return {
      index: i, sectionId: p.sectionId || `page-${i + 1}`, sectionTitle: p.sectionTitle,
      purpose: p.purpose, layouts: [layout], research: p.research, nth, of: counts.get(p.sectionId) ?? 1,
      narrativeJob: p.narrativeJob, composition: p.composition, visualBrief: p.visualBrief, evidenceNeed: p.evidenceNeed,
    };
  });
}

export async function planContent(input: {
  brief: Brief; spec: DocTypeSpec; classification: InstitutionClassification; sources: ResearchSource[]; slideCount: number;
}): Promise<{ plan: PlannedSlide[]; outlineError?: string }> {
  const staticPlan = balanceSilhouettes(enrichVisualPlan(buildBlueprint(input.spec, input.slideCount), input.sources));
  if (!hasLlm()) return { plan: staticPlan, outlineError: "AI 키가 없어 기본 목차를 사용합니다." };
  const result = await generateOutlineWithLlm(OUTLINE_SYSTEM, outlinePrompt({ ...input, target: input.slideCount, staticPlan }));
  const plan = balanceSilhouettes(enrichVisualPlan(normalizeOutline(result.pages, staticPlan, input.sources, input.brief), input.sources));
  return { plan, outlineError: result.error };
}

/**
 * Merges the model's output back onto the blueprint. The blueprint is the source
 * of truth for how many slides exist and what each one is for, so a model that
 * returns too few, too many, or an empty slide can't corrupt the deck's
 * structure — that slot just falls back to deterministic content.
 */
function reconcile(
  plan: PlannedSlide[],
  llmSlides: (SlideContent | undefined)[] | null,
  fallback: SlideContent[]
): { slides: SlideContent[]; usedLlm: boolean } {
  if (!llmSlides || llmSlides.length === 0) return { slides: fallback, usedLlm: false };

  let filled = 0;
  const slides = plan.map((planned, i) => {
    const got = llmSlides[i];
    const hasBody =
      got &&
      (got.title ||
        got.bullets?.length ||
        got.columns?.length ||
        got.steps?.length ||
        got.stats?.length ||
        got.cards?.length ||
        got.milestones?.length ||
        got.table?.rows?.length ||
        got.imageUrl ||
        got.chartData?.length ||
        got.quote ||
        got.profile);


    if (!hasBody) return fallback[i];
    filled++;

    return {
      ...got,
      // The blueprint decides which section a slide belongs to; the model only
      // supplies the words. Layout falls back to the planned one if the model
      // picked something outside this section's allowed set.
      sectionId: planned.sectionId,
      layout: planned.layouts.includes(got.layout) ? got.layout : planned.layouts[0],
      sources: Array.isArray(got.sources) ? got.sources : [],
    } satisfies SlideContent;
  });

  return { slides, usedLlm: filled > 0 };
}

function enrichVisualPlan(plan: PlannedSlide[], sources: ResearchSource[]): PlannedSlide[] {
  const hasImages = sources.some((s) => Boolean(s.imageUrl));
  let visualIndex = 0;
  return plan.map((slide, i) => {
    if (slide.layouts.includes("stats") && !slide.layouts.includes("chart") && i % 2 === 0) {
      return { ...slide, layouts: ["chart", ...slide.layouts] };
    }
    if (hasImages && slide.research && i > 1 && i < plan.length - 1 && visualIndex++ % 3 === 0) {
      return { ...slide, layouts: ["visual", ...slide.layouts] };
    }
    return slide;
  });
}

function balanceSilhouettes(plan: PlannedSlide[]): PlannedSlide[] {
  const textLike = new Set(["bullets", "quote", "profile"]);
  let textStreak = 0;
  return plan.map((slide) => {
    if (!textLike.has(slide.layouts[0])) { textStreak = 0; return slide; }
    textStreak++;
    if (textStreak < 3) return slide;
    const visualAlternative = slide.layouts.find((l) => !textLike.has(l));
    textStreak = 0;
    return visualAlternative ? { ...slide, layouts: [visualAlternative, ...slide.layouts.filter((l) => l !== visualAlternative)] } : slide;
  });
}

export async function generateContent(input: {
  brief: Brief;
  spec: DocTypeSpec;
  classification: InstitutionClassification;
  sources: ResearchSource[];
  slideCount: number;
  approvedPlan?: PlannedSlide[];
}): Promise<ContentResult> {
  // Without a model we cannot write a distinct title and body for a second or
  // third slide of the same section — padding one out produces "핵심 개념 1/2/3",
  // which is worse than a shorter, honest deck. So the no-LLM path builds one
  // slide per section and the UI tells the user a key unlocks the full length.
  const target = hasLlm() ? input.slideCount : input.spec.sections.length;
  const planned = input.approvedPlan?.length === target
    ? { plan: input.approvedPlan.map((p, index) => ({ ...p, index })) }
    : await planContent({ ...input, slideCount: target });
  const plan = planned.plan;
  const fallback = buildFallbackSlides({
    brief: input.brief,
    spec: input.spec,
    plan,
    sources: input.sources,
  });

  if (!hasLlm()) return { slides: fallback, plan, usedLlm: false };

  // Chunked: one call per CHUNK_SIZE slides, run in parallel. A single call for
  // a 40-slide deck overran max_tokens and came back truncated, which used to
  // fail silently into an empty skeleton. Each chunk sees the whole outline for
  // context but only writes its own range.
  const chunks: PlannedSlide[][] = [];
  for (let i = 0; i < plan.length; i += CHUNK_SIZE) chunks.push(plan.slice(i, i + CHUNK_SIZE));

  const results = await Promise.all(
    chunks.map((range) =>
      generateSlidesWithLlm(
        SYSTEM_PROMPT,
        buildUserPrompt({
          brief: input.brief,
          spec: input.spec,
          classification: input.classification,
          sources: input.sources,
          plan,
          range,
        })
      )
    )
  );

  // Stitch the chunks back onto the full plan by index.
  const merged: SlideContent[] = new Array(plan.length);
  let anyFilled = false;
  const errors: string[] = [];
  results.forEach((res, ci) => {
    if (res.error) errors.push(res.error);
    const range = chunks[ci];
    res.slides?.forEach((slide, i) => {
      const planned = range[i];
      if (planned) {
        merged[planned.index] = slide;
        anyFilled = true;
      }
    });
  });

  if (!anyFilled) {
    return { slides: fallback, plan, usedLlm: false, llmError: errors[0] ?? "AI 생성에 실패했어요." };
  }

  const { slides, usedLlm } = reconcile(plan, merged, fallback);
  return { slides, plan, usedLlm, llmError: errors.length > 0 ? errors[0] : undefined };
}
