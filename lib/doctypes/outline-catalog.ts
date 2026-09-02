import { DocTypeSpec, IntakeField, SectionSpec } from "./spec";

const CORE: IntakeField[] = [
  { name: "topic", label: "주제", type: "text", required: true, group: "core", placeholder: "발표 주제를 입력하세요" },
  { name: "institutionName", label: "대상 기관·회사명", type: "text", required: true, group: "core" },
  { name: "institutionUrl", label: "홈페이지 URL", type: "text", group: "core", placeholder: "https://…" },
  { name: "audience", label: "발표 대상", type: "text", group: "audience", placeholder: "예: 심사위원, 고객, 참여자" },
  { name: "slideCount", label: "슬라이드 수", type: "number", group: "audience", placeholder: "자동" },
  { name: "mustInclude", label: "반드시 포함할 내용", type: "textarea", group: "detail" },
  { name: "tone", label: "문체·톤", type: "text", group: "detail", placeholder: "예: 전문적이고 설득력 있게" },
];

const cover: SectionSpec = { id: "cover", title: "표지", purpose: "발표의 핵심 메시지를 한 문장으로 선명하게 제시한다.", layouts: ["cover"], weight: 1, fixed: true };
const close: SectionSpec = { id: "closing", title: "결론과 다음 행동", purpose: "핵심 결론을 회수하고 청중이 취할 구체적인 다음 행동을 제시한다.", layouts: ["closing"], weight: 1, fixed: true };
const S = (id: string, title: string, purpose: string, layouts: SectionSpec["layouts"], weight = 1, research = false): SectionSpec => ({ id, title, purpose, layouts, weight, research });

function make(id: DocTypeSpec["id"], label: string, tagline: string, description: string, sections: SectionSpec[], affinity: string[]): DocTypeSpec {
  return { id, label, tagline, description, sizing: { mode: "scope", min: sections.length + 2, max: 36, fallback: Math.max(18, sections.length + 2) }, fields: CORE, sections: [cover, ...sections, close], designAffinity: affinity, researchAngles: sections.filter(s => s.research).map(s => s.title) };
}

export const OUTLINE_CATALOG_TYPES: DocTypeSpec[] = [
  make("plan", "기획안·프로젝트 승인", "배경에서 승인 요청까지", "현재 상황과 필요성을 근거로 실행안·일정·예산을 제시해 승인을 이끕니다.", [
    S("background", "기획 배경과 현재 상황", "현재 상황과 추진 필요성을 근거로 보여준다.", ["stats", "bullets", "compare"], 2, true),
    S("goal", "목표와 대상자", "누구의 어떤 변화를 만들 것인지 측정 가능한 목표로 제시한다.", ["cards", "stats"]),
    S("concept", "기획 콘셉트와 전략", "기획의 한 문장 콘셉트와 이를 구현할 핵심 전략을 연결한다.", ["quote", "cards", "process"], 2),
    S("program", "세부 프로그램과 운영", "실행 과제, 운영 방법, 역할을 구체화한다.", ["process", "table", "timeline"], 3),
    S("resource", "일정·인력·예산", "필요 자원과 산정 근거를 투명하게 제시한다.", ["timeline", "table", "stats"], 2),
    S("risk", "위험과 성과관리", "위험 대응과 성공 측정 방법을 짝지어 제시한다.", ["compare", "table"]),
    S("approval", "승인·협조 요청", "결정권자가 승인해야 할 항목을 명확히 요청한다.", ["bullets", "cards"]),
  ], ["premium_editorial", "corporate_strategy", "simplep_mono"]),
  make("product", "상품·서비스 소개", "문제 공감에서 구매 행동까지", "고객 문제를 환기하고 기능·혜택·증거·가격·신청 방법을 설득 흐름으로 엮습니다.", [
    S("problem", "고객 문제와 손실", "고객이 겪는 문제와 방치 비용을 구체적으로 보여준다.", ["compare", "stats", "quote"], 2, true),
    S("audience", "타깃 고객과 사용 상황", "누가 언제 이 상품을 필요로 하는지 장면으로 제시한다.", ["profile", "cards"]),
    S("offer", "상품과 핵심 기능", "상품의 작동 방식과 핵심 기능을 기능 나열이 아닌 가치로 설명한다.", ["cards", "process"], 3),
    S("benefit", "고객 혜택과 전후 비교", "사용 전후의 변화를 증거와 함께 보여준다.", ["compare", "stats"], 2),
    S("proof", "사례·후기·신뢰 근거", "실제 사례와 검증 가능한 신뢰 근거를 제시한다.", ["quote", "cards", "stats"], 2),
    S("price", "구성·가격·보증", "가격, 포함 범위, 보증 조건을 투명하게 정리한다.", ["table", "cards"]),
    S("action", "신청 방법", "구매 또는 신청 절차를 짧고 명확하게 안내한다.", ["process"]),
  ], ["sunset_boulevard", "golden_hour", "premium_editorial"]),
  make("policy", "정책·제도·사업 안내", "대상과 신청 절차를 오해 없이", "정책의 변화, 지원 대상, 혜택, 절차와 주의사항을 정확하게 안내합니다.", [
    S("background", "추진 배경과 달라진 점", "정책의 목적과 기존 제도 대비 변화를 설명한다.", ["compare", "bullets"], 2, true),
    S("content", "주요 지원 내용", "지원 내용, 금액, 범위, 기간을 명확히 정리한다.", ["stats", "table", "cards"], 3),
    S("eligibility", "지원·제외 대상", "자격 기준과 제외 조건을 혼동 없이 비교한다.", ["compare", "table"], 2),
    S("process", "일정과 신청 절차", "신청부터 선정까지의 단계와 제출물을 연결한다.", ["timeline", "process", "table"], 3),
    S("criteria", "심사 기준과 선정", "평가 기준과 선정 절차를 구체적으로 제시한다.", ["table", "process"]),
    S("caution", "실수·주의사항·문의", "자주 생기는 오류와 해결 방법, 문의처를 안내한다.", ["bullets", "cards"]),
  ], ["public_data", "arctic_frost", "ocean_depths"]),
  make("case_study", "사례발표·교육 후기", "상황에서 결과와 교훈까지", "문제와 실행 과정을 따라가며 성과, 교훈, 확산 방법을 보여줍니다.", [
    S("context", "기관·대상과 당시 상황", "사례의 배경과 해결해야 했던 문제를 구체화한다.", ["profile", "bullets", "stats"], 2),
    S("need", "요구와 목표", "대상자의 요구를 목표와 성공 기준으로 전환한다.", ["compare", "cards"]),
    S("design", "해결 방향과 설계", "프로그램 또는 프로젝트의 설계 논리를 설명한다.", ["process", "cards"], 2),
    S("execution", "준비와 실행 과정", "실행 과정을 시간순으로 보여주고 주요 의사결정을 설명한다.", ["timeline", "process"], 3),
    S("results", "반응과 성과", "정량·정성 성과와 전후 변화를 함께 제시한다.", ["stats", "quote", "compare"], 3),
    S("learning", "성공 요인과 배운 점", "성공 요인, 아쉬운 점, 재현 조건을 솔직하게 정리한다.", ["cards", "bullets"]),
    S("scale", "다른 현장 적용과 향후 계획", "확산 방법과 다음 계획을 행동 단위로 제시한다.", ["process", "timeline"]),
  ], ["botanical_garden", "youth_pop", "premium_editorial"]),
  make("analysis", "비교·분석·의사결정", "기준과 증거로 최적안을 선택", "질문과 평가 기준을 먼저 세우고 선택지를 비교해 최종 추천으로 수렴합니다.", [
    S("question", "의사결정 질문과 목표", "무엇을 왜 결정해야 하는지 한 문장으로 정의한다.", ["quote", "bullets"]),
    S("criteria", "평가 기준과 가중치", "평가 항목과 중요도를 투명하게 제시한다.", ["table", "stats"], 2),
    S("options", "선택지 소개", "각 선택지의 성격과 전제조건을 동일한 기준으로 소개한다.", ["cards", "table"], 3, true),
    S("comparison", "기능·비용·효과 비교", "핵심 차이를 한눈에 비교하고 의미를 해석한다.", ["compare", "table", "stats"], 3),
    S("risk", "장단점과 위험", "선택지별 장단점과 위험을 균형 있게 평가한다.", ["compare", "table"], 2),
    S("recommendation", "최적안과 추천 이유", "평가 결과에 근거해 최적안을 추천한다.", ["stats", "bullets", "quote"], 2),
    S("execution", "실행 방법과 예비계획", "선택 후 실행 단계와 대안을 제시한다.", ["process", "timeline"]),
  ], ["corporate_strategy", "simplep_mono", "arctic_frost"]),
  make("research", "연구·조사 결과", "질문에서 결과와 시사점까지", "연구 질문, 방법, 데이터, 결과와 한계를 논리적으로 연결합니다.", [
    S("background", "연구 배경과 필요성", "기존 자료의 빈틈과 연구 필요성을 근거로 제시한다.", ["bullets", "compare"], 2, true),
    S("question", "연구 목적과 질문", "연구가 답하려는 질문과 범위를 명확히 정의한다.", ["quote", "bullets"]),
    S("method", "대상·표본·조사 방법", "조사 대상, 기간, 표본, 분석 기준을 투명하게 설명한다.", ["process", "table"], 2),
    S("results", "주요 결과", "핵심 결과를 수치와 시각적 비교 중심으로 제시한다.", ["stats", "table", "compare"], 4),
    S("interpretation", "결과 해석과 시사점", "결과의 의미와 예상 밖 결과를 해석한다.", ["bullets", "quote", "compare"], 2),
    S("application", "활용 방안", "실무·정책에서 결과를 어떻게 활용할지 제안한다.", ["process", "cards"]),
    S("limits", "한계와 후속 과제", "연구의 한계와 후속 질문을 명시한다.", ["bullets", "timeline"]),
  ], ["simplep_ink", "ocean_depths", "arctic_frost"]),
  make("campaign", "홍보·캠페인·행사", "관심에서 참여 행동까지", "문제와 혜택을 짧고 선명하게 전달해 참여·신청으로 이어지게 합니다.", [
    S("hook", "핵심 슬로건과 문제", "청중이 즉시 공감할 문제와 캠페인 메시지를 제시한다.", ["quote", "stats"], 2, true),
    S("goal", "목표와 참여 대상", "누구의 어떤 참여를 만들 것인지 설명한다.", ["cards", "profile"]),
    S("program", "주요 프로그램", "참여자가 경험할 프로그램을 매력적으로 소개한다.", ["cards", "timeline"], 3),
    S("experience", "참여 혜택과 기대 경험", "참여 후 얻게 될 변화와 혜택을 구체화한다.", ["compare", "quote", "cards"], 2),
    S("proof", "이전 사례와 신뢰", "이전 행사 사례와 검증 가능한 성과를 제시한다.", ["stats", "quote"]),
    S("info", "일정·장소·유의사항", "참여에 필요한 정보를 빠짐없이 정리한다.", ["table", "timeline"]),
    S("join", "신청 방법", "신청 기간, 절차, 문의처를 한눈에 안내한다.", ["process"]),
  ], ["event_energetic", "sunset_boulevard", "youth_pop"]),
  make("improvement", "문제 해결·개선 제안", "원인에서 실행 가능한 해결안까지", "문제를 정의하고 근본 원인과 대안을 비교해 실행 가능한 개선안을 제안합니다.", [
    S("problem", "현재 상황과 문제 영향", "문제의 범위와 영향을 데이터로 구체화한다.", ["stats", "bullets", "compare"], 3, true),
    S("cause", "직접·근본 원인", "증상과 원인을 구분하고 인과관계를 설명한다.", ["process", "compare"], 2),
    S("stakeholder", "이해관계자와 해결 기준", "영향받는 사람과 성공 판단 기준을 정의한다.", ["cards", "table"]),
    S("alternatives", "해결 대안", "복수 대안을 동일한 기준으로 제시한다.", ["cards", "compare"], 3),
    S("solution", "최적 해결안", "선정 근거와 핵심 실행 과제를 연결한다.", ["quote", "process", "bullets"], 2),
    S("roadmap", "우선순위·일정·자원", "실행 순서, 담당, 예산과 자원을 구체화한다.", ["timeline", "table", "process"], 2),
    S("measure", "위험 대응과 성과관리", "위험, 대응책, 성과지표와 점검 주기를 제시한다.", ["table", "stats"]),
  ], ["corporate_strategy", "public_data", "tech_innovation"]),
];
