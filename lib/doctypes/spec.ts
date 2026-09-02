import { DocType, SlideLayout } from "../types";

/** One question on the type-specific intake form. */
export interface IntakeField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number";
  placeholder?: string;
  help?: string;
  required?: boolean;
  /** Groups render as labelled fieldsets, in this order, on the /new form. */
  group: "core" | "audience" | "company" | "presenter" | "detail";
}

/**
 * A section of the deck's blueprint. `weight` is how many slides this section
 * gets relative to the others — the sizer distributes the target slide count
 * across sections by weight, so a 20-slide and a 40-slide deck of the same type
 * keep the same shape but differ in depth.
 */
export interface SectionSpec {
  id: string;
  title: string;
  /** Fed verbatim to the LLM: what this section must accomplish. */
  purpose: string;
  layouts: SlideLayout[];
  weight: number;
  /** Whether claims here should be grounded in researched sources. */
  research?: boolean;
  /** Always produce exactly one slide, never scaled by weight (표지/맺음말). */
  fixed?: boolean;
  /**
   * Hard cap on slides for this section. Defaults from `weight`: a weight-1
   * section is structural (진행 순서, 교육 목표) and must never repeat, while
   * content sections may expand. Without a cap a 120분 deck produced titles like
   * "핵심 개념 7" — a numbered section is not an outline.
   */
  maxSlides?: number;
}

export function sectionCap(section: SectionSpec): number {
  if (section.fixed) return 1;
  return section.maxSlides ?? (section.weight <= 1 ? 1 : section.weight * 3);
}

/** The most slides this doc type can carry while every slide still has a real job. */
export function blueprintCeiling(spec: DocTypeSpec): number {
  return spec.sections.reduce((sum, s) => sum + sectionCap(s), 0);
}

/**
 * How the target slide count is derived. Lectures and workshops are paced by
 * clock time (a 60분 강의 ≈ 20장); documents that get read rather than presented
 * are sized by scope instead, so time is irrelevant to them.
 */
export interface SizingRule {
  mode: "time" | "scope";
  /** time mode: minutes of speaking per slide. */
  minutesPerSlide?: number;
  min: number;
  max: number;
  fallback: number;
}

export interface DocTypeSpec {
  id: DocType;
  label: string;
  tagline: string;
  description: string;
  sizing: SizingRule;
  fields: IntakeField[];
  sections: SectionSpec[];
  /** Preset ids from lib/design/presets.ts that suit this document type. */
  designAffinity: string[];
  /** Extra search phrases appended to the institution/topic research query. */
  researchAngles: string[];
}

export const FIELD_GROUP_LABEL: Record<IntakeField["group"], string> = {
  core: "기본 정보",
  audience: "대상과 분량",
  company: "회사·기관 정보",
  presenter: "발표자 정보",
  detail: "세부 요청",
};

/**
 * Distributes `target` slides across the blueprint's sections. Fixed sections
 * (cover, closing) always take exactly one; the rest share what's left in
 * proportion to their weight, with every section guaranteed at least one slide
 * so no part of the blueprint silently disappears from a short deck.
 */
export function allocateSlides(sections: SectionSpec[], target: number): Map<string, number> {
  const out = new Map<string, number>();
  const caps = new Map(sections.map((s) => [s.id, sectionCap(s)]));

  // Every section gets exactly one slide first — no part of the blueprint may
  // vanish from a short deck.
  for (const s of sections) out.set(s.id, 1);

  let budget = target - sections.length;
  if (budget <= 0) return out;

  // Hand out the remainder by weight, one pass at a time, skipping any section
  // already at its cap. Looping (rather than a single proportional split) means
  // slides freed by a capped section flow to sections that can still use them.
  const flex = sections.filter((s) => !s.fixed && (caps.get(s.id) ?? 1) > 1);
  while (budget > 0) {
    const open = flex.filter((s) => (out.get(s.id) ?? 1) < (caps.get(s.id) ?? 1));
    if (open.length === 0) break; // every section is full — the deck caps here

    const totalWeight = open.reduce((sum, s) => sum + s.weight, 0) || 1;
    let handedThisPass = 0;
    for (const s of [...open].sort((a, b) => b.weight - a.weight)) {
      if (budget - handedThisPass <= 0) break;
      const share = Math.max(1, Math.round(((budget * s.weight) / totalWeight) * 0.5));
      const room = (caps.get(s.id) ?? 1) - (out.get(s.id) ?? 1);
      const give = Math.min(share, room, budget - handedThisPass);
      out.set(s.id, (out.get(s.id) ?? 1) + give);
      handedThisPass += give;
    }
    if (handedThisPass === 0) break;
    budget -= handedThisPass;
  }

  return out;
}

/** Resolves the slide count for a brief: explicit override > sizing rule > fallback. */
export function resolveSlideCount(
  spec: DocTypeSpec,
  input: { slideCount?: number; durationMinutes?: number }
): number {
  // Floor: every section gets at least one slide. Ceiling: no section may be
  // padded past its cap, so we never invent "핵심 개념 7" just to hit a number.
  const floor = Math.max(spec.sizing.min, spec.sections.length);
  const ceiling = Math.max(floor, Math.min(spec.sizing.max, blueprintCeiling(spec)));
  const clamp = (n: number) => Math.min(ceiling, Math.max(floor, Math.round(n)));

  if (input.slideCount && input.slideCount > 0) return clamp(input.slideCount);

  if (spec.sizing.mode === "time" && input.durationMinutes && spec.sizing.minutesPerSlide) {
    return clamp(input.durationMinutes / spec.sizing.minutesPerSlide);
  }

  return clamp(spec.sizing.fallback);
}
