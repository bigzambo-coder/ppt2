import { Brief, ResearchSource, SlideContent, SlideLayout } from "../types";
import { DocTypeSpec } from "../doctypes/spec";
import { PlannedSlide } from "./blueprint";

/**
 * Which intake field feeds each blueprint section. When the user has typed
 * something here, the fallback renders their actual words rather than filler —
 * so a deck built with no API key is still specific to this company/brief
 * instead of a template with the title swapped in.
 */
const SECTION_SOURCE_FIELD: Record<string, string> = {
  // 회사 소개서
  ceo: "ceoMessage",
  history: "history",
  business: "businessArea",
  strength: "strength",
  clients: "clients",
  credential: "certifications",
  // 투자·IR
  oneliner: "oneLiner",
  problem: "problem",
  solution: "solution",
  market: "marketSize",
  model: "businessModel",
  traction: "traction",
  moat: "competition",
  team: "team",
  ask: "ask",
  // 결과 보고서
  results: "results",
  quant: "results",
  improve: "issues",
  next: "nextPlan",
  // 사업 제안서
  budget: "budget",
  schedule: "period",
  // 강의·워크숍
  presenter: "presenterBio",
};

const PLACEHOLDER = "[확인 필요]";

/**
 * Splits a textarea answer into list items on newlines, commas, or bullet marks.
 * The leading-marker strip deliberately matches only real list markers ("- ",
 * "* ", "1. ") — a bare \d+ here would eat the year off "1995 법인 설립" and
 * leave the 연혁 timeline with no dates.
 */
function toItems(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,·•]/)
    .map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter((s) => s.length > 0);
}

/**
 * The slice of a section's items belonging to slide `nth` of `of`. Without this,
 * every slide in a multi-slide section renders the same list — the exact
 * "제목만 바뀐 같은 내용" repetition this app exists to avoid. When there aren't
 * enough items to go around, the first slide takes them all and later slides
 * come back empty so they render their own distinct prompt instead of a copy.
 */
function sliceFor<T>(items: T[], nth: number, of: number): T[] {
  if (of <= 1) return items;
  if (items.length < of * 2) return nth === 1 ? items : [];
  const size = Math.ceil(items.length / of);
  return items.slice((nth - 1) * size, nth * size);
}

/** Parses "2015 법인 설립" / "2015년 - 법인 설립" into {when, what}. */
function toMilestones(raw: string | undefined): { when: string; what: string }[] {
  return toItems(raw)
    .map((line) => {
      const m = line.match(/^(\d{4}(?:[.\-/]\d{1,2})?년?)\s*[-–—:]?\s*(.+)$/);
      return m ? { when: m[1], what: m[2].trim() } : { when: PLACEHOLDER, what: line };
    })
    .slice(0, 6);
}

/** Splits "MAU 3만" style entries into a stat value + label when possible. */
function toStats(raw: string | undefined): { value: string; label: string }[] {
  return toItems(raw)
    .map((item) => {
      const m = item.match(/^(.+?)\s*[:\s]\s*([\d.,]+\s*\S*)$/);
      if (m) return { value: m[2].trim(), label: m[1].trim() };
      const m2 = item.match(/^(.+?)\s+([\d.,]+\S*)$/);
      if (m2) return { value: m2[2].trim(), label: m2[1].trim() };
      return { value: PLACEHOLDER, label: item };
    })
    .slice(0, 4);
}

/**
 * A real time-blocked agenda, computed from the training duration and the doc
 * type's own section weights — no model needed. The 진행 순서 slide is the one
 * place where the brief already contains everything required to write a genuine
 * slide, so it should never render as a placeholder.
 */
function agendaFromDuration(spec: DocTypeSpec, minutes: number): { when: string; what: string }[] {
  const content = spec.sections.filter((s) => !s.fixed && s.id !== "agenda");
  const totalWeight = content.reduce((sum, s) => sum + s.weight, 0) || 1;

  const out: { when: string; what: string }[] = [];
  let elapsed = 0;
  content.forEach((s, i) => {
    // Round to 5-minute blocks — an agenda saying "13분" reads like a machine wrote it.
    const raw = (minutes * s.weight) / totalWeight;
    const block = i === content.length - 1 ? minutes - elapsed : Math.max(5, Math.round(raw / 5) * 5);
    if (block <= 0) return;
    out.push({ when: `${elapsed}~${elapsed + block}분`, what: s.title });
    elapsed += block;
  });

  return out.filter((m) => !m.when.startsWith(`${minutes}~`));
}

function fill(
  planned: PlannedSlide,
  brief: Brief,
  spec: DocTypeSpec,
  sources: ResearchSource[],
  recent: SlideLayout[]
): SlideContent {
  const field = SECTION_SOURCE_FIELD[planned.sectionId];
  const raw = field ? brief.fields[field]?.trim() : undefined;
  const items = sliceFor(toItems(raw), planned.nth, planned.of);

  // `stats` needs real numbers we may not have. Degrading it straight to
  // `bullets` (the old behavior) collapsed layout variety and produced runs of
  // three identical layouts, so step to the next layout this section allows
  // instead — the blueprint's variety survives the downgrade.
  let layout = planned.layouts[0];
  const dataless = (l: SlideLayout) => l === "stats" || l === "table";
  if (layout === "stats" && toStats(raw).length === 0) {
    layout = planned.layouts.find((l) => !dataless(l)) ?? "bullets";
  }

  // The blueprint plans layout variety, but the redirect above can still land
  // three identical layouts in a row. Check against what was actually emitted
  // (not what was planned) and step to another layout this section allows.
  const [prev, prev2] = [recent[recent.length - 1], recent[recent.length - 2]];
  if (layout === prev && layout === prev2) {
    layout =
      planned.layouts.find((l) => l !== layout && !dataless(l)) ??
      planned.layouts.find((l) => l !== layout) ??
      layout;
  }
  // NEVER put `planned.purpose` on a slide. It is an instruction addressed to the
  // writer ("…행동 동사로 3가지 이내 제시한다"), and rendering it printed internal
  // directions onto the user's deck. Empty slots get a short, human placeholder
  // that reads like a note to the presenter instead.
  const prompt = `${planned.sectionTitle} 내용을 입력해 주세요`;

  const base: SlideContent = {
    layout,
    // No "핵심 개념 3" numbering — a numbered section title is not an outline.
    // Multi-slide sections are only produced on the LLM path, which writes a
    // real distinct title per slide.
    title: planned.sectionTitle,
    sectionId: planned.sectionId,
  };

  // Ground the first slide of a researched section in a real source when we have one.
  const source = planned.research && planned.nth === 1 ? sources[0] : undefined;
  if (source) base.sources = [source.id];

  switch (layout) {
    case "cover":
      return { ...base, layout: "cover", title: brief.topic, subtitle: brief.institutionName };

    case "closing":
      return {
        ...base,
        layout: "closing",
        title: "감사합니다",
        subtitle: brief.fields.contact || brief.institutionName,
      };

    case "timeline": {
      if (planned.sectionId === "agenda" && brief.durationMinutes) {
        return { ...base, milestones: agendaFromDuration(spec, brief.durationMinutes) };
      }
      const milestones = sliceFor(toMilestones(raw), planned.nth, planned.of);
      return { ...base, milestones: milestones.length > 0 ? milestones : [{ when: "", what: prompt }] };
    }

    case "cards":
      return {
        ...base,
        cards:
          items.length > 0
            ? items.slice(0, 4).map((it) => ({ title: it, description: PLACEHOLDER }))
            : [{ title: planned.sectionTitle, description: prompt }],
      };

    case "profile":
      return {
        ...base,
        profile: {
          name: brief.fields.presenterName || brief.fields.ceoName || brief.institutionName,
          // Parenthesised deliberately: `a || b ? c : d` binds as `(a || b) ? c : d`,
          // which threw away the user's actual 직함 and labelled everyone 대표.
          role: brief.fields.presenterTitle || (brief.fields.ceoName ? "대표" : PLACEHOLDER),
          detail: raw || brief.fields.presenterBio || PLACEHOLDER,
        },
      };

    case "quote":
      return {
        ...base,
        quote: raw || prompt,
        quoteAttribution: brief.fields.ceoName || brief.fields.presenterName || brief.institutionName,
      };

    // Only reached when toStats() found real numbers — the empty case was
    // re-routed to another layout above rather than inventing figures.
    case "stats":
      return { ...base, stats: toStats(raw) };

    case "table":
      return {
        ...base,
        table: {
          headers: ["항목", "내용"],
          rows: items.length > 0 ? items.slice(0, 6).map((it) => [it, PLACEHOLDER]) : [[prompt, PLACEHOLDER]],
        },
      };

    case "compare":
      return {
        ...base,
        columns: [
          { title: "현재", items: [PLACEHOLDER] },
          { title: "개선 후", items: items.length > 0 ? items.slice(0, 3) : [PLACEHOLDER] },
        ],
      };

    case "process":
      return {
        ...base,
        steps:
          items.length >= 2
            ? items.slice(0, 4).map((it, i) => ({ title: `${i + 1}단계`, description: it }))
            : [
                { title: "1단계", description: PLACEHOLDER },
                { title: "2단계", description: PLACEHOLDER },
                { title: "3단계", description: PLACEHOLDER },
              ],
      };

    case "divider":
      return { ...base, subtitle: prompt };

    default:
      return {
        ...base,
        layout: "bullets" as SlideLayout,
        bullets: items.length > 0 ? items.slice(0, 5) : [prompt],
      };
  }
}

/**
 * Deterministic content used when no ANTHROPIC_API_KEY is configured (or the LLM
 * call fails). Follows the same blueprint the LLM would have, so the deck's
 * structure is already correct and every slide is at least labelled with its own
 * job — the user fills the gaps in the preview editor.
 */
export function buildFallbackSlides(input: {
  brief: Brief;
  spec: DocTypeSpec;
  plan: PlannedSlide[];
  sources: ResearchSource[];
}): SlideContent[] {
  // Sequential, not `.map` — each slide's layout choice depends on what the
  // previous two slides actually ended up rendering.
  const emitted: SlideLayout[] = [];
  const slides: SlideContent[] = [];
  for (const planned of input.plan) {
    const slide = fill(planned, input.brief, input.spec, input.sources, emitted);
    emitted.push(slide.layout);
    slides.push(slide);
  }
  return slides;
}
