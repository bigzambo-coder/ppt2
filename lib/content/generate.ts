import { Brief, InstitutionClassification, SlideContent } from "../types";
import { ResearchResult } from "../research";
import { generateSlidesWithLlm, hasLlm } from "../anthropic";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { buildFallbackSlides } from "./fallback";

export interface ContentResult {
  slides: SlideContent[];
  usedLlm: boolean;
}

export async function generateContent(input: {
  brief: Brief;
  classification: InstitutionClassification;
  research: ResearchResult | null;
}): Promise<ContentResult> {
  if (hasLlm()) {
    const userPrompt = buildUserPrompt(input);
    const slides = await generateSlidesWithLlm(SYSTEM_PROMPT, userPrompt);
    if (slides && slides.length > 0) {
      return { slides, usedLlm: true };
    }
  }

  return { slides: buildFallbackSlides(input), usedLlm: false };
}
