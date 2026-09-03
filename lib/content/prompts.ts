import { Brief, InstitutionClassification, ResearchSource } from "../types";
import { DocTypeSpec } from "../doctypes/spec";
import { PlannedSlide } from "./blueprint";

export const SYSTEM_PROMPT = `너는 한국 기업·공공기관 대상 프레젠테이션을 만드는 기획·집필 전문가다.
주어진 슬라이드 설계도(각 장의 목적)에 따라, 장마다 서로 다른 실제 내용을 쓴다.

[제목 원칙 — 가장 중요]
- 설계도에 적힌 "섹션 이름"은 분류용 내부 라벨이다. 그것을 슬라이드 제목으로 그대로 쓰지 않는다.
- 제목은 그 장에서 실제로 다루는 내용을 담은 구체적 문구여야 한다. 예: 섹션이 "핵심 개념"이면 제목은 "핵심 개념"이 아니라 "카드뉴스는 8장이 기본이다"처럼 쓴다.
- 한 섹션이 여러 장일 때 "핵심 개념 1", "핵심 개념 2"처럼 번호를 붙이는 것을 절대 금지한다. 각 장이 서로 다른 소주제를 다루고, 제목도 서로 완전히 달라야 한다.
- 설계도의 "목적"은 너에게 주는 지시문이다. 그 문장을 슬라이드 본문이나 제목에 절대 그대로 옮기지 않는다.

[내용 원칙]
- 각 슬라이드는 그 장의 "목적"에 적힌 임무만 수행한다. 목적이 다르면 내용도 반드시 달라야 한다.
- 슬라이드만 읽어도 이해되도록 구체적으로 쓴다. 절차, 기준, 수치, 예시, 실제 문장을 담는다.
- 다음과 같은 빈 문장은 절대 금지한다: "~에 필요한 핵심 내용과 적용 사례를 설명합니다", "~에 대해 알아봅니다", "중요성을 이해합니다", "효율적으로 개선합니다". 이런 문장이 하나라도 있으면 실패다.
- 같은 문장 구조를 여러 장에 반복하지 않는다. 제목만 바뀐 동일 문장은 금지다.
- 불릿 한 줄은 15~45자. 한 슬라이드에 불릿 5개 이하.

[사실 원칙]
- 사용자가 입력한 정보(회사 정보, 실적, 연혁 등)는 그대로 활용한다. 입력에 없는 회사 사실·거래처·수치·인증을 지어내지 않는다.
- 확인되지 않은 값은 "[확인 필요]"로 표시한다. 그럴듯한 숫자를 만들어 채우지 않는다.
- 조사 출처 목록이 주어지면 그 목록의 사실만 근거로 인용하고, 인용한 슬라이드의 sources에 출처 id를 넣는다. 목록에 없는 id를 쓰지 않는다.
- stats(지표)와 table(표) 레이아웃은 실제 값이 있을 때만 쓴다. 값이 없으면 항목만 두고 값은 "[확인 필요]"로 쓴다. 가짜 통계를 만들지 않는다.
- chart는 출처나 사용자 입력에 실제 숫자가 2개 이상 있을 때만 쓴다. 숫자를 추정하거나 만들어내지 않는다.
- visual은 조사 출처에 imageUrl이 제공된 경우에만 쓴다. URL을 바꾸거나 새로 만들지 않는다.

[시각 구성 원칙]
- 한 장에는 하나의 메시지와 하나의 시각 중심을 둔다.
- bullets만 3장 연속 쓰지 않는다. 이미지·비교·과정·표·지표·그래프를 내용에 맞게 교차한다.
- 표와 그래프에는 제목을 반복하지 말고, 무엇을 읽어야 하는지 chartInsight 또는 subtitle로 결론을 쓴다.
- 장식용 도형과 의미 없는 아이콘을 채우지 않는다. 사진·실제 화면·데이터·비교·과정 중 메시지를 가장 빨리 증명하는 것을 고른다.
- 페이지 설계에 적힌 필요 근거가 없으면 그래프나 사례를 꾸며내지 말고, 확인 가능한 설명형 시각화로 바꾼다.
- 3~5장마다 화면 실루엣을 바꾸고, 같은 카드 배열을 반복하지 않는다.

[레이아웃별 채워야 할 항목]
- cover: title, subtitle
- agenda: title, milestones[] (2~6개, when=번호·시간, what=구간명). 일반 연혁 timeline과 구분한다.
- bullets: title, bullets[] (3~5개)
- compare: title, columns[] (2개, 각각 title과 items[])
- process: title, steps[] (3~5개, description 30자 이내)
- stats: title, stats[] (2~4개, 각각 value와 label)
- table: title, table{headers[], rows[][]}
- cards: title, cards[] (정확히 3개, 각각 title과 description 70자 이내)
- timeline: title, milestones[] (3~6개, 각각 when과 what)
- profile: title, profile{name, role, detail}
- visual: title, imageUrl, imageCaption, imagePosition(left/right/full), bullets[](0~3개)
- chart: title, chartType(bar/line/donut), chartData[{label,value}], chartInsight
- quote: title, quote, quoteAttribution
- divider: title, subtitle
- closing: title, subtitle

emit_slides 도구로만 응답하고, 설계도와 같은 개수·같은 순서로 slides 배열을 반환한다.`;

function formatFields(spec: DocTypeSpec, brief: Brief): string[] {
  const lines: string[] = [];
  for (const field of spec.fields) {
    // Core/sizing fields are reported separately in the header block below.
    if (["topic", "institutionName", "institutionUrl", "slideCount"].includes(field.name)) continue;
    const value = brief.fields[field.name]?.trim();
    if (value) lines.push(`- ${field.label}: ${value}`);
  }
  return lines;
}

export function buildUserPrompt(input: {
  brief: Brief;
  spec: DocTypeSpec;
  classification: InstitutionClassification;
  sources: ResearchSource[];
  plan: PlannedSlide[];
  /** The slice of `plan` this call must actually write (chunked generation). */
  range?: PlannedSlide[];
}): string {
  const { brief, spec, classification, sources, plan } = input;
  const range = input.range ?? plan;
  const lines: string[] = [];

  lines.push(`# 문서 유형: ${spec.label}`);
  lines.push(spec.description);
  lines.push("");
  lines.push(`# 기본 정보`);
  lines.push(`- 주제: ${brief.topic}`);
  lines.push(`- 대상 기관·회사: ${brief.institutionName} (분류: ${classification.label})`);
  if (brief.audience) lines.push(`- 대상: ${brief.audience}`);
  if (brief.durationMinutes) lines.push(`- 시간: ${brief.durationMinutes}분`);

  const fieldLines = formatFields(spec, brief);
  if (fieldLines.length > 0) {
    lines.push("");
    lines.push(`# 사용자가 입력한 정보 (이 내용을 실제로 반영할 것)`);
    lines.push(...fieldLines);
  }
  if (brief.fields.aiInterview?.trim()) {
    lines.push("");
    lines.push("# AI 맞춤 인터뷰 답변 (강의 사례·실습·난이도·환경에 반드시 반영)");
    lines.push(brief.fields.aiInterview.trim());
  }

  if (sources.length > 0) {
    lines.push("");
    lines.push(`# 조사 출처 (아래 id로만 인용 가능)`);
    for (const s of sources.slice(0, 6)) {
      lines.push(`[${s.id}] ${s.title} — ${s.excerpt}${s.imageUrl ? ` — imageUrl=${s.imageUrl}` : ""}`);
    }
  }

  // Whole-deck outline for context, so a chunk knows what the other chunks
  // cover and doesn't repeat them.
  if (range.length !== plan.length) {
    lines.push("");
    lines.push(`# 덱 전체 구성 (총 ${plan.length}장) — 참고용, 중복 방지에 사용`);
    lines.push(plan.map((p) => `${p.index + 1}.${p.sectionTitle}`).join(" / "));
  }

  lines.push("");
  lines.push(`# 이번에 작성할 슬라이드 (${range.length}장, 이 순서와 개수를 정확히 지킬 것)`);
  for (const p of range) {
    const position = p.of > 1 ? ` (${p.sectionTitle} ${p.nth}/${p.of}번째 장)` : "";
    lines.push(
      `${p.index + 1}. [${p.sectionTitle}]${position} layout=${p.layouts[0]} — ${p.purpose}${
        p.research && sources.length > 0 ? " (가능하면 출처를 인용할 것)" : ""
      }\n   · 페이지 역할: ${p.narrativeJob}\n   · 구성: ${p.composition}\n   · 권장 시각자료: ${p.visualBrief}\n   · 필요한 근거: ${p.evidenceNeed}`
    );
  }

  lines.push("");
  lines.push(
    `slides 배열에 정확히 ${range.length}개를 위 순서대로 반환한다. 같은 섹션에서 여러 장을 쓸 때는 각 장이 서로 다른 하위 주제를 다뤄야 하고, 같은 내용을 나눠 쓰거나 반복하면 안 된다.`
  );

  return lines.join("\n");
}
