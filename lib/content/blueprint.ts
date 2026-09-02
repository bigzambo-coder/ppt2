import { SlideLayout } from "../types";
import { DocTypeSpec, allocateSlides } from "../doctypes/spec";

/**
 * One planned slide. This is the brief handed to the writer for that specific
 * slide — its section, its job, and which layouts are allowed. Giving the model
 * a distinct purpose per slide (rather than one deck-level instruction) is what
 * stops it from emitting the same sentence with the heading swapped in.
 */
export interface PlannedSlide {
  index: number;
  sectionId: string;
  sectionTitle: string;
  purpose: string;
  layouts: SlideLayout[];
  research: boolean;
  /** Position within its section: slide `nth` of `of`. */
  nth: number;
  of: number;
  /** Page-level editorial direction: the visual is planned with the message, not added afterward. */
  narrativeJob: string;
  composition: string;
  visualBrief: string;
  evidenceNeed: string;
}

function pageDirection(section: DocTypeSpec["sections"][number], layout: SlideLayout) {
  const key = `${section.id} ${section.title} ${section.purpose}`;
  if (layout === "cover") return { narrativeJob: "발표의 중심 약속을 한 문장으로 각인", composition: "최소 정보의 표지, 강한 타이포그래피와 단일 키 비주얼", visualBrief: "주제를 상징하는 고품질 사진·일러스트 1개 또는 절제된 그래픽", evidenceNeed: "기관명·발표명·발표자처럼 사용자가 입력한 정보" };
  if (layout === "closing") return { narrativeJob: "첫 장의 질문을 회수하고 다음 행동을 요청", composition: "결론 문장과 행동 요청을 크게 분리", visualBrief: "핵심 메시지를 보조하는 상징 이미지 또는 여백 중심 마감", evidenceNeed: "연락처·실행 요청 등 입력된 사실" };
  if (/agenda|목차|순서|개요/.test(key)) return { narrativeJob: "전체 흐름과 각 구간의 역할을 한눈에 안내", composition: "3~6개 구간을 번호·시간·연결선으로 보여주는 로드맵", visualBrief: "텍스트 목록 대신 타임라인·경로도·섹션 맵", evidenceNeed: "실제 섹션명과 발표 시간" };
  if (/시장|성과|지표|통계|규모|추세|정량|결과/.test(key)) return { narrativeJob: "숫자에서 청중이 알아야 할 변화와 의미를 증명", composition: "그래프 70% + 우측 핵심 해석 30%", visualBrief: "추세=선, 항목 비교=막대, 구성비=도넛. 실제 수치가 없으면 stats나 비교표로 전환", evidenceNeed: "출처가 있는 수치·기간·단위·표본" };
  if (/방법|사용|시연|실습|과정|절차|추진|운영/.test(key)) return { narrativeJob: "청중이 그대로 따라 할 수 있도록 행동 순서를 설명", composition: "실제 화면 또는 결과물 중심, 단계 번호와 짧은 콜아웃", visualBrief: "제품 화면 캡처·전후 화면·3~5단계 과정도", evidenceNeed: "실제 입력값, 수행 단계, 예상 결과와 성공 기준" };
  if (/문제|배경|필요|왜|현황|한계/.test(key)) return { narrativeJob: "현재 상태의 긴장과 해결 필요성을 납득", composition: "현상 이미지 또는 근거 차트 + 한 문장 결론", visualBrief: "현장 사진·비포/애프터·원인 구조·근거 그래프 중 하나", evidenceNeed: "현재 상태를 입증하는 사례 또는 출처" };
  if (/비교|경쟁|차별|대안|개선|위험/.test(key)) return { narrativeJob: "선택 기준과 우선순위를 명확하게 만듦", composition: "2안 비교 또는 평가축이 있는 표, 추천 항목 강조", visualBrief: "전후 비교·2열 비교·결정 매트릭스", evidenceNeed: "비교 기준, 관찰 근거, 확인 가능한 차이" };
  if (/사례|고객|적용|후기/.test(key)) return { narrativeJob: "추상적 설명을 실제 장면과 결과로 구체화", composition: "사례 이미지 1개 + 상황·행동·결과 3단 구조", visualBrief: "실제 사례 사진·제품 사용 장면·인용문·결과 수치", evidenceNeed: "출처가 확인되는 사례만 사용" };
  if (/일정|연혁|로드맵|계획/.test(key)) return { narrativeJob: "시간에 따른 변화와 책임 시점을 설명", composition: "가로 타임라인과 3~6개 마일스톤", visualBrief: "타임라인·단계별 산출물·전환점 강조", evidenceNeed: "실제 날짜·기간·산출물" };
  if (/조직|팀|강사|대표|역량/.test(key)) return { narrativeJob: "누가 왜 이 일을 해낼 수 있는지 신뢰 형성", composition: "인물 또는 조직 이미지 + 역할·근거", visualBrief: "인물 사진·조직 구조·대표 실적", evidenceNeed: "이름, 역할, 검증 가능한 경력·실적" };
  if (/예산|체크|기준|정책|주의/.test(key)) return { narrativeJob: "복잡한 조건을 빠르게 확인하고 판단", composition: "행과 열이 적은 표, 핵심 셀만 색으로 강조", visualBrief: "비교표·체크리스트·우선순위 매트릭스", evidenceNeed: "항목, 기준, 단위와 예외 조건" };
  return { narrativeJob: "핵심 개념을 한 문장 결론과 구체적 예시로 이해", composition: "큰 개념 이미지 또는 간단한 구조 60% + 설명 40%", visualBrief: "개념 사진·제품 화면·간결한 흐름도·2열 비교 중 내용에 가장 직접적인 형식", evidenceNeed: "정의보다 실제 예시와 적용 조건" };
}

/**
 * Expands a doc-type blueprint to exactly `target` slides, distributing the
 * count across sections by weight and assigning each slide a layout from its
 * section's allowed set — never the same layout three times in a row, which is
 * the deck-level QA rule enforced in lib/pptx/qa.ts.
 */
export function buildBlueprint(spec: DocTypeSpec, target: number): PlannedSlide[] {
  const allocation = allocateSlides(spec.sections, target);
  const planned: PlannedSlide[] = [];
  const recent: SlideLayout[] = [];

  for (const section of spec.sections) {
    const count = allocation.get(section.id) ?? 1;

    for (let n = 0; n < count; n++) {
      // Rotate through the section's allowed layouts, skipping any choice that
      // would make three identical layouts in a row.
      let layout = section.layouts[n % section.layouts.length];
      if (recent.length >= 2 && recent[recent.length - 1] === layout && recent[recent.length - 2] === layout) {
        layout = section.layouts.find((l) => l !== layout) ?? layout;
      }
      recent.push(layout);
      const direction = pageDirection(section, layout);

      planned.push({
        index: planned.length,
        sectionId: section.id,
        sectionTitle: section.title,
        purpose: section.purpose,
        // The chosen layout leads, but the writer may pick another from the
        // section's set if the content genuinely suits it better.
        layouts: [layout, ...section.layouts.filter((l) => l !== layout)],
        research: Boolean(section.research),
        nth: n + 1,
        of: count,
        ...direction,
      });
    }
  }

  return planned;
}
