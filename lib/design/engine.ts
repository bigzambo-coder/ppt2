import { DesignToken, DocType, InstitutionType } from "../types";
import { DESIGN_PRESETS, DesignPreset } from "./presets";
import { getDocTypeSpec } from "../doctypes/registry";

export interface DesignInput {
  docType: DocType;
  institutionType: InstitutionType;
  institutionName: string;
  topic: string;
  audience?: string;
  /** Optional hex colors discovered by the research engine (e.g. from the institution's site). */
  brandColors?: string[];
  /**
   * Which of the ranked candidates to use. 0 = best fit; incrementing it walks
   * down the ranking, which is what the UI's "다른 조합 보기" does — a different
   * palette every time, but always one that still fits the brief rather than a
   * random pick.
   */
  variant?: number;
}

function score(preset: DesignPreset, input: DesignInput, haystack: string, affinity: string[]): number {
  let s = 0;
  // The document type is the strongest signal — an IR deck and a 소상공인 워크숍
  // should not land on the same palette even for the same institution.
  if (affinity.includes(preset.id)) s += 6 - affinity.indexOf(preset.id) * 0.5;
  if (preset.institutionTypes.includes(input.institutionType)) s += 3;
  for (const kw of preset.keywords) {
    if (haystack.includes(kw.toLowerCase())) s += 2;
  }
  return s;
}

/** Ranks every preset for this brief, best fit first. */
export function rankDesigns(input: DesignInput): DesignPreset[] {
  const haystack = `${input.institutionName} ${input.topic} ${input.audience ?? ""}`.toLowerCase();
  const affinity = getDocTypeSpec(input.docType).designAffinity;

  return [...DESIGN_PRESETS]
    .map((preset) => ({ preset, s: score(preset, input, haystack, affinity) }))
    .sort((a, b) => b.s - a.s || a.preset.id.localeCompare(b.preset.id))
    .map((r) => r.preset);
}

function toToken(preset: DesignPreset, input?: DesignInput, variant = 0): DesignToken {
  const coverStyles: NonNullable<DesignToken["coverStyle"]>[] = ["split", "editorial", "poster", "frame"];
  const titleStyles: NonNullable<DesignToken["titleStyle"]>[] = ["rule", "index", "block", "badge"];
  const density: NonNullable<DesignToken["density"]>[] = ["balanced", "airy", "compact"];
  const docOffset = input ? getDocTypeSpec(input.docType).sections.length : 0;
  return {
    id: preset.id,
    label: preset.label,
    background: preset.background,
    surface: preset.surface,
    textPrimary: preset.textPrimary,
    textSecondary: preset.textSecondary,
    primary: preset.primary,
    accent: [...preset.accent],
    fontHeading: "Pretendard ExtraBold",
    fontBody: "Pretendard",
    mood: [...preset.mood],
    shapeLanguage: preset.shapeLanguage,
    coverStyle: coverStyles[(variant + docOffset) % coverStyles.length],
    titleStyle: titleStyles[(variant + docOffset) % titleStyles.length],
    density: density[(variant + Math.floor(docOffset / 2)) % density.length],
  };
}

/**
 * Picks the design for a brief. Ranking is deterministic, so the same input plus
 * the same variant always yields the same deck — regenerating never silently
 * reshuffles a design the user already approved in the preview.
 */
export function pickDesign(input: DesignInput): DesignToken {
  const ranked = rankDesigns(input);
  const rawVariant = input.variant ?? 0;
  // Keep relevance dominant while still allowing the brief hash to select among
  // the best-fitting visual families instead of always returning candidate 0.
  const candidateWindow = Math.min(5, ranked.length);
  const variant = ((rawVariant % candidateWindow) + candidateWindow) % candidateWindow;
  const token = toToken(ranked[variant], input, rawVariant);

  // A brand color scraped from the institution's own site beats our palette's
  // primary — but only the accent role is layered on top, so we never wreck the
  // palette's background/text contrast with an unvetted color.
  if (input.brandColors && input.brandColors.length > 0) {
    const brand = input.brandColors[0]?.replace("#", "");
    if (brand && /^[0-9a-fA-F]{6}$/.test(brand)) {
      token.primary = brand.toUpperCase();
    }
  }

  return token;
}

/** Label + palette of the top N alternatives, for the preview's design switcher. */
export function designAlternatives(input: DesignInput, count = 6): { variant: number; token: DesignToken }[] {
  return rankDesigns(input)
    .slice(0, count)
    .map((preset, i) => ({ variant: i, token: toToken(preset, input, i) }));
}
