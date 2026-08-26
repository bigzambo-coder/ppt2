import { DocType, InstitutionType } from "../types";

// Condensed from 기획서_자동생성_코덱스용.md §6 (A~F table-of-contents per institution type),
// adapted from a multi-page DOCX structure into slide-sized sections since every doc type
// now renders to .pptx.
const PROPOSAL_BASE = [
  "교육 개요",
  "추진 배경과 필요성",
  "교육목표와 성과지표",
  "세부 커리큘럼",
  "운영조건과 기관 협조사항",
  "강사 적합성",
  "제공 산출물",
];

const PROPOSAL_EXTRA: Partial<Record<InstitutionType, string[]>> = {
  public_bid: ["요구사항 대응표", "위험관리", "정량평가 증빙"],
  corporate: ["현업 문제와 해결안", "성과 측정(KPI)", "보안과 개인정보"],
  small_business: ["참여자 분석(업종·수준)", "현장 운영 준비"],
  school: ["학습자 분석", "학습목표·활동·평가 정렬", "안전과 소통"],
  event: ["당일 운영표", "역할분담", "홍보와 모집"],
};

const PRESENTATION_SECTIONS = [
  "오프닝",
  "문제 제기",
  "핵심 메시지",
  "본론 1",
  "본론 2",
  "사례 또는 데모",
  "정리 및 제안",
  "Q&A",
];

const INTRO_SECTIONS = [
  "소개",
  "전문 분야",
  "강의·서비스 실적",
  "대표 프로그램",
  "고객 후기 또는 성과",
  "연락처",
];

/** Returns the ordered list of section names (Korean) a deck of this type/institution should cover. */
export function buildSections(docType: DocType, institutionType: InstitutionType): string[] {
  if (docType === "presentation") return PRESENTATION_SECTIONS;
  if (docType === "intro") return INTRO_SECTIONS;
  return [...PROPOSAL_BASE, ...(PROPOSAL_EXTRA[institutionType] ?? [])];
}
