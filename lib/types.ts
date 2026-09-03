// ---------------------------------------------------------------------------
// Document types
//
// docType is the SPINE of this app: it decides which intake fields to ask for,
// how many slides to produce, which sections the deck must cover, which layouts
// each section may use, and which design families fit. Everything downstream
// (form, sizing, prompt, fallback, design pick) reads from the registry in
// lib/doctypes/registry.ts rather than hardcoding per-type behavior.
// ---------------------------------------------------------------------------

export type DocType =
  | "lecture" // 강의·교육 발표자료 (시간 기반)
  | "workshop" // 워크숍·실습 워크숍 (시간 기반, 실습 중심)
  | "proposal" // 사업 제안서
  | "company" // 회사 소개서
  | "ir" // 투자·IR 자료
  | "report" // 결과 보고서
  | "plan" // 기획안·프로젝트 승인
  | "product" // 상품·서비스 소개
  | "policy" // 정책·제도 안내
  | "case_study" // 사례발표·교육 후기
  | "analysis" // 비교·분석·의사결정
  | "research" // 연구·조사 결과
  | "campaign" // 홍보·캠페인·행사
  | "improvement"; // 문제 해결·개선 제안

export type InstitutionType =
  | "public_general" // A: 공공기관·지자체
  | "public_bid" // B: 공공기관 교육용역 입찰
  | "corporate" // C: 기업·중소기업
  | "small_business" // D: 소상공인
  | "school" // E: 학교·대학
  | "event"; // F: 행사·특강

export interface InstitutionClassification {
  type: InstitutionType;
  label: string;
  reason: string;
  matchedKeywords: string[];
}

export interface ResearchSource {
  id: string;
  title: string;
  url?: string;
  publisher: string;
  excerpt: string;
  accessedAt: string;
  /** Representative image discovered from the cited page (normally og:image). */
  imageUrl?: string;
}

/**
 * Core fields every doc type needs, plus `fields` — the type-specific answers
 * collected from the intake form defined by that doc type's spec (e.g. a company
 * profile's 대표/연혁/거래처, an IR deck's 시장규모/투자요청).
 */
export interface Brief {
  docType: DocType;
  topic: string;
  institutionName: string;
  institutionUrl?: string;
  audience?: string;
  durationMinutes?: number;
  slideCount?: number;
  tone?: string;
  mustInclude?: string;
  fields: Record<string, string>;
}

export interface DesignToken {
  id: string;
  label: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  accent: string[];
  fontHeading: string;
  fontBody: string;
  mood: string[];
  shapeLanguage: "sharp" | "rounded" | "organic";
  /** Independent composition axes: palettes no longer determine every slide's silhouette. */
  coverStyle?: "split" | "editorial" | "poster" | "frame";
  titleStyle?: "badge" | "rule" | "index" | "block";
  density?: "airy" | "balanced" | "compact";
}

export type SlideLayout =
  | "cover"
  | "agenda"
  | "divider"
  | "bullets"
  | "compare"
  | "process"
  | "stats"
  | "table"
  | "quote"
  | "timeline" // 연혁 / 로드맵 / 추진일정
  | "cards" // 사업영역 / 제품 / 서비스 3~4개
  | "profile" // 대표·강사·팀 소개
  | "visual" // source-backed image + short interpretation
  | "chart" // real numeric data only
  | "closing";

export const ALL_LAYOUTS: SlideLayout[] = [
  "cover",
  "agenda",
  "divider",
  "bullets",
  "compare",
  "process",
  "stats",
  "table",
  "quote",
  "timeline",
  "cards",
  "profile",
  "visual",
  "chart",
  "closing",
];

export interface SlideContent {
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  columns?: { title: string; items: string[] }[];
  steps?: { title: string; description: string }[];
  stats?: { value: string; label: string }[];
  table?: { headers: string[]; rows: string[][] };
  quote?: string;
  quoteAttribution?: string;
  /** timeline layout: chronological milestones (연혁, 로드맵, 일정). */
  milestones?: { when: string; what: string }[];
  /** cards layout: 2~4 parallel offerings (사업영역, 제품군). */
  cards?: { title: string; description: string }[];
  /** profile layout: a person (대표, 강사, 팀 리드). */
  profile?: { name: string; role: string; detail: string };
  imageUrl?: string;
  imageData?: string;
  imageCaption?: string;
  imagePosition?: "left" | "right" | "full";
  chartType?: "bar" | "line" | "donut";
  chartData?: { label: string; value: number }[];
  chartInsight?: string;
  notes?: string;
  /** Which section of the doc-type blueprint this slide belongs to. */
  sectionId?: string;
  /** IDs into GeneratedDeck.sources — the research facts this slide's claims rest on. */
  sources?: string[];
}

export interface GeneratedDeck {
  id: string;
  brief: Brief;
  classification: InstitutionClassification;
  design: DesignToken;
  slides: SlideContent[];
  createdAt: string;
  fileName: string;
  usedLlm: boolean;
  /** Present when AI generation was attempted but failed — shown to the user verbatim. */
  llmError?: string;
  qa: QAReport;
  sources: ResearchSource[];
}

export interface QAIssue {
  severity: "warning" | "error";
  message: string;
  slideIndex?: number;
}

export interface QAReport {
  passed: boolean;
  issues: QAIssue[];
}
