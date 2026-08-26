import { DesignToken, InstitutionType } from "../types";
import { DESIGN_PRESETS, DesignPreset } from "./presets";

export interface DesignInput {
  institutionType: InstitutionType;
  institutionName: string;
  topic: string;
  audience?: string;
  /** Optional hex colors discovered by the research engine (e.g. from the institution's site). */
  brandColors?: string[];
}

function score(preset: DesignPreset, input: DesignInput, haystack: string): number {
  let s = 0;
  if (preset.institutionTypes.includes(input.institutionType)) s += 3;
  for (const kw of preset.keywords) {
    if (haystack.includes(kw.toLowerCase())) s += 2;
  }
  return s;
}

/**
 * Picks the best-fitting design preset for a brief. Keyword/type matching only for MVP —
 * a future research-enriched version can pass brandColors to bias the final token toward
 * the institution's actual brand palette.
 */
export function pickDesign(input: DesignInput): DesignToken {
  const haystack = `${input.institutionName} ${input.topic} ${input.audience ?? ""}`.toLowerCase();

  let best = DESIGN_PRESETS[0];
  let bestScore = -1;
  for (const preset of DESIGN_PRESETS) {
    const s = score(preset, input, haystack);
    if (s > bestScore) {
      bestScore = s;
      best = preset;
    }
  }

  // No keyword/type signal at all — fall back to a safe, neutral default rather than
  // whatever happens to be first in the array.
  if (bestScore <= 0) {
    best = DESIGN_PRESETS.find((p) => p.id === "corporate_strategy") ?? best;
  }

  const token: DesignToken = {
    id: best.id,
    label: best.label,
    background: best.background,
    surface: best.surface,
    textPrimary: best.textPrimary,
    textSecondary: best.textSecondary,
    primary: best.primary,
    accent: [...best.accent],
    fontHeading: best.fontHeading,
    fontBody: best.fontBody,
    mood: [...best.mood],
    shapeLanguage: best.shapeLanguage,
  };

  if (input.brandColors && input.brandColors.length > 0) {
    token.primary = input.brandColors[0];
    if (input.brandColors[1]) token.accent = [input.brandColors[1], ...token.accent];
  }

  return token;
}
