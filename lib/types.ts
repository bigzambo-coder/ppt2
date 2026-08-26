export type DocType = "proposal" | "presentation" | "intro";

export type InstitutionType =
  | "public_general" // A: 공공기관·지자체 일반교육
  | "public_bid" // B: 공공기관 교육용역 입찰
  | "corporate" // C: 기업·중소기업 교육
  | "small_business" // D: 소상공인 지원교육
  | "school" // E: 학교·대학 교육
  | "event"; // F: 행사·특강

export interface InstitutionClassification {
  type: InstitutionType;
  label: string;
  reason: string;
  matchedKeywords: string[];
}

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
  presenterName?: string;
  presenterTitle?: string;
  presenterOrg?: string;
  presenterBio?: string;
  contact?: string;
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
}

export type SlideLayout =
  | "cover"
  | "divider"
  | "bullets"
  | "compare"
  | "process"
  | "stats"
  | "table"
  | "quote"
  | "closing";

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
  notes?: string;
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
  qa: QAReport;
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
