import { Brief, InstitutionClassification } from "../types";
import { ResearchResult } from "../research";
import { buildSections } from "./toc";

const DOC_TYPE_LABEL: Record<Brief["docType"], string> = {
  proposal: "제안서",
  presentation: "발표 PPT",
  intro: "회사·강사 소개서",
};

export const SYSTEM_PROMPT = `너는 한국 공공기관·기업·학교 대상 교육 제안서와 발표 자료를 만드는 기획 전문가다.
- 사실이 확인되지 않은 기관 정책, 통계, 실적, 예산은 만들지 말고 "[기관 확인 필요]"로 표시한다.
- 교육목표는 "이해한다"가 아니라 참여자가 할 수 있게 되는 구체적 행동으로 쓴다.
- 슬라이드 15장 기준 레이아웃 종류를 6개 이상 섞고, 같은 레이아웃을 3장 연속 쓰지 않는다.
- 본문 불릿은 슬라이드 하나에 5개 이내, 한 줄은 25자 내외로 간결하게 쓴다.
- 표는 개요·커리큘럼·성과지표·역할분담·일정처럼 구조화된 정보에만 쓴다.
- emit_slides 도구로만 응답한다.`;

export function buildUserPrompt(input: {
  brief: Brief;
  classification: InstitutionClassification;
  research: ResearchResult | null;
}): string {
  const { brief, classification, research } = input;
  const sections = buildSections(brief.docType, classification.type);

  const lines: string[] = [];
  lines.push(`문서 종류: ${DOC_TYPE_LABEL[brief.docType]}`);
  lines.push(`대상 기관: ${brief.institutionName} (유형: ${classification.label})`);
  lines.push(`주제: ${brief.topic}`);
  if (brief.audience) lines.push(`교육/청중 대상: ${brief.audience}`);
  if (brief.durationMinutes) lines.push(`시간: ${brief.durationMinutes}분`);
  if (brief.tone) lines.push(`문체: ${brief.tone}`);
  if (brief.mustInclude) lines.push(`반드시 포함할 내용: ${brief.mustInclude}`);
  if (brief.presenterName) {
    lines.push(
      `발표자/강사: ${brief.presenterName}${brief.presenterTitle ? ` (${brief.presenterTitle})` : ""}${brief.presenterOrg ? `, ${brief.presenterOrg}` : ""}`
    );
  }
  if (brief.presenterBio) lines.push(`발표자 소개: ${brief.presenterBio}`);
  if (brief.contact) lines.push(`연락처: ${brief.contact}`);

  if (research) {
    lines.push(`\n기관 관련 조사 결과 (사실관계 반영, 과장하지 말 것):`);
    for (const fact of research.facts.slice(0, 5)) lines.push(`- ${fact}`);
  }

  const targetCount = brief.slideCount ?? Math.max(sections.length, 8);
  lines.push(`\n다음 섹션 순서를 반드시 지키되, 섹션당 1~2장으로 나눠 총 ${targetCount}장 내외로 구성한다:`);
  sections.forEach((s, i) => lines.push(`${i + 1}. ${s}`));

  lines.push(
    `\n첫 슬라이드는 layout="cover"로 제목/부제, 마지막 슬라이드는 layout="closing"으로 마무리한다. 각 섹션 성격에 맞는 layout(bullets/compare/process/stats/table/quote/divider)을 선택한다.`
  );

  return lines.join("\n");
}
