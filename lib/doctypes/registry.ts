import { DocType } from "../types";
import { DocTypeSpec, IntakeField } from "./spec";
import { OUTLINE_CATALOG_TYPES } from "./outline-catalog";

// Fields shared by every doc type. Type-specific specs append their own on top.
const COMMON_CORE: IntakeField[] = [
  { name: "topic", label: "주제", type: "text", required: true, group: "core", placeholder: "예: 생성형 AI 업무 활용" },
  { name: "institutionName", label: "대상 기관·회사명", type: "text", required: true, group: "core", placeholder: "예: 창원테크노파크" },
  { name: "institutionUrl", label: "홈페이지 URL", type: "text", group: "core", placeholder: "https://…", help: "입력하면 실제 사이트를 조사해 내용과 브랜드 색을 반영해요." },
];

const DETAIL_FIELDS: IntakeField[] = [
  { name: "mustInclude", label: "반드시 포함할 내용", type: "textarea", group: "detail", placeholder: "예: 실습은 스마트폰 위주로, 보안 주의사항 포함" },
  { name: "tone", label: "문체·톤", type: "text", group: "detail", placeholder: "예: 쉽고 친근하게 / 격식 있게" },
];

const PRESENTER_FIELDS: IntakeField[] = [
  { name: "presenterName", label: "발표자 이름", type: "text", group: "presenter", placeholder: "예: 문정수" },
  { name: "presenterTitle", label: "직함", type: "text", group: "presenter", placeholder: "예: AI 강사" },
  { name: "presenterOrg", label: "소속", type: "text", group: "presenter" },
  { name: "presenterBio", label: "약력·실적", type: "textarea", group: "presenter", placeholder: "주요 경력, 강의 실적 등" },
  { name: "contact", label: "연락처", type: "text", group: "presenter", placeholder: "이메일 또는 전화번호" },
];

const TIME_FIELDS: IntakeField[] = [
  { name: "audience", label: "교육 대상", type: "text", group: "audience", placeholder: "예: 기업대표 20명", required: true },
  { name: "durationMinutes", label: "교육 시간(분)", type: "number", group: "audience", placeholder: "60", help: "시간에 맞춰 슬라이드 장수와 진행 순서를 자동 편성해요." },
  { name: "headcount", label: "참여 인원", type: "number", group: "audience", placeholder: "20" },
  { name: "slideCount", label: "슬라이드 수 (직접 지정)", type: "number", group: "audience", placeholder: "자동", help: "비워두면 시간 기준으로 계산해요." },
];

const SCOPE_FIELDS: IntakeField[] = [
  { name: "audience", label: "읽는 사람 / 심사 대상", type: "text", group: "audience", placeholder: "예: 심사위원, 투자 심사역" },
  { name: "slideCount", label: "슬라이드 수 (직접 지정)", type: "number", group: "audience", placeholder: "자동", help: "비워두면 유형별 표준 분량으로 구성해요." },
];

// ---------------------------------------------------------------------------

const LECTURE: DocTypeSpec = {
  id: "lecture",
  label: "강의·교육 발표자료",
  tagline: "시간에 맞춰 진행 순서까지 편성",
  description: "교육 시간을 넣으면 장수와 흐름을 자동으로 배분하고, 개념→사례→실습→정리로 이어지는 강의 리듬을 만듭니다.",
  sizing: { mode: "time", minutesPerSlide: 3, min: 8, max: 60, fallback: 20 },
  fields: [...COMMON_CORE, ...TIME_FIELDS, ...PRESENTER_FIELDS, ...DETAIL_FIELDS],
  designAffinity: ["template_kit_blue", "public_data", "school_fresh", "youth_pop", "ocean_depths", "arctic_frost", "botanical_garden"],
  researchAngles: ["교육 사례", "활용 방법", "최신 동향"],
  sections: [
    { id: "cover", title: "표지", purpose: "주제·기관·일자를 한눈에 보여주는 표지.", layouts: ["cover"], weight: 1, fixed: true },
    { id: "presenter", title: "강사 소개", purpose: "강사의 이름·소속·이 주제를 가르칠 자격이 되는 실적을 간결히 소개한다.", layouts: ["profile"], weight: 1, fixed: true },
    { id: "goal", title: "오늘 교육의 목표", purpose: "참가자가 교육 후 '할 수 있게 되는 것'을 행동 동사로 3가지 이내 제시한다. '이해한다'가 아니라 '만들 수 있다' 수준으로 쓴다.", layouts: ["bullets", "cards"], weight: 1 },
    { id: "agenda", title: "진행 순서", purpose: "전체 시간을 블록으로 나눈 진행표. 각 블록의 소요 시간을 분 단위로 명시한다.", layouts: ["agenda"], weight: 1 },
    { id: "why", title: "왜 지금 필요한가", purpose: "대상 청중이 처한 실제 문제와 변화를 근거와 함께 제시해 학습 동기를 만든다.", layouts: ["stats", "compare", "bullets"], weight: 2, research: true },
    { id: "concept", title: "핵심 개념", purpose: "주제의 핵심 개념을 청중 눈높이로 설명한다. 용어 정의보다 '무엇을 할 수 있는가'를 중심에 둔다.", layouts: ["bullets", "compare", "cards", "process"], weight: 4, research: true },
    { id: "howto", title: "실제 사용 방법", purpose: "실제 화면·절차·입력 예시를 단계로 보여준다. 따라 하면 그대로 재현되도록 구체적으로 쓴다.", layouts: ["process", "table", "bullets"], weight: 4, research: true },
    { id: "case", title: "적용 사례", purpose: "대상 기관·업종과 비슷한 실제 적용 사례를 든다. 확인되지 않은 사례는 지어내지 않는다.", layouts: ["cards", "compare", "quote"], weight: 2, research: true },
    { id: "practice", title: "실습", purpose: "참가자가 직접 해보는 활동. 입력자료, 수행 지시, 예상 결과, 성공 기준을 모두 포함한다.", layouts: ["process", "table", "bullets"], weight: 2 },
    { id: "caution", title: "주의사항과 검증", purpose: "사실 확인, 개인정보·기업정보 보호 등 실무 적용 시 지켜야 할 기준을 체크리스트로 제시한다.", layouts: ["bullets", "table"], weight: 1 },
    { id: "wrap", title: "정리와 다음 단계", purpose: "핵심 3가지를 요약하고, 교육 직후 바로 실행할 다음 행동을 제시한다.", layouts: ["bullets", "process"], weight: 1 },
    { id: "closing", title: "맺음말", purpose: "감사 인사와 연락처.", layouts: ["closing"], weight: 1, fixed: true },
  ],
};

const WORKSHOP: DocTypeSpec = {
  id: "workshop",
  label: "워크숍·실습 자료",
  tagline: "실습 중심, 결과물을 만들어 가는 구성",
  description: "참가자가 손으로 직접 결과물을 완성하는 흐름입니다. 시연 → 실습 → 공유 → 점검이 반복되도록 편성합니다.",
  sizing: { mode: "time", minutesPerSlide: 3, min: 10, max: 60, fallback: 20 },
  fields: [...COMMON_CORE, ...TIME_FIELDS, ...PRESENTER_FIELDS, ...DETAIL_FIELDS],
  designAffinity: ["template_kit_blue", "youth_pop", "small_business_bright", "school_fresh", "sunset_boulevard", "botanical_garden", "golden_hour"],
  researchAngles: ["실습 예제", "사용법", "템플릿"],
  sections: [
    { id: "cover", title: "표지", purpose: "주제·기관·일자를 보여주는 표지.", layouts: ["cover"], weight: 1, fixed: true },
    { id: "outcome", title: "오늘 만들 결과물", purpose: "워크숍이 끝났을 때 참가자 손에 남는 구체적 산출물을 보여준다. 추상적 목표가 아니라 '무엇이 완성되는지'를 명시한다.", layouts: ["cards", "bullets"], weight: 1 },
    { id: "agenda", title: "진행 순서", purpose: "시간 블록별 진행표. 설명·시연·실습·공유에 각각 몇 분을 쓰는지 명시한다.", layouts: ["agenda"], weight: 1 },
    { id: "prep", title: "준비사항", purpose: "참가자가 시작 전에 준비해야 할 계정·기기·자료를 체크리스트로 제시한다.", layouts: ["bullets", "table"], weight: 1 },
    { id: "concept", title: "최소한의 개념", purpose: "실습에 필요한 만큼만 개념을 설명한다. 이론을 길게 늘어놓지 않는다.", layouts: ["bullets", "compare", "cards"], weight: 2, research: true },
    { id: "demo", title: "시연", purpose: "강사가 먼저 해 보이는 단계. 실제 입력값과 그 결과를 그대로 보여준다.", layouts: ["process", "table", "compare"], weight: 3, research: true },
    { id: "practice1", title: "실습 1", purpose: "첫 번째 실습. 입력자료, 수행 지시, 예상 결과, 성공 기준을 반드시 포함한다.", layouts: ["process", "table", "bullets"], weight: 3 },
    { id: "improve", title: "결과 개선", purpose: "1차 결과물을 수정·확장하는 방법. 수정 전후를 비교해 보여준다.", layouts: ["compare", "process"], weight: 2 },
    { id: "practice2", title: "실습 2", purpose: "두 번째 실습 또는 심화 과제. 마찬가지로 지시·결과·기준을 포함한다.", layouts: ["process", "table", "bullets"], weight: 2 },
    { id: "share", title: "공유와 피드백", purpose: "참가자 결과물을 공유하고 서로 점검하는 방법과 관점을 제시한다.", layouts: ["bullets", "table"], weight: 1 },
    { id: "checklist", title: "검증 체크리스트", purpose: "완성한 결과물이 실무에 쓸 만한지 판단하는 기준을 체크리스트로 제시한다.", layouts: ["table", "bullets"], weight: 1 },
    { id: "apply", title: "현업 적용", purpose: "워크숍이 끝난 뒤 각자 조직에서 이어서 할 행동을 구체적으로 제시한다.", layouts: ["process", "bullets"], weight: 1 },
    { id: "closing", title: "맺음말", purpose: "감사 인사와 연락처.", layouts: ["closing"], weight: 1, fixed: true },
  ],
};

const PROPOSAL: DocTypeSpec = {
  id: "proposal",
  label: "사업 제안서",
  tagline: "필요성 → 해결방안 → 실행계획 → 기대효과",
  description: "심사자가 판단하는 순서대로 구성합니다. 배경과 문제 정의로 설득하고, 실행계획·예산·성과지표로 신뢰를 만듭니다.",
  sizing: { mode: "scope", min: 10, max: 28, fallback: 16 },
  fields: [
    ...COMMON_CORE,
    ...SCOPE_FIELDS,
    { name: "budget", label: "사업 예산 규모", type: "text", group: "detail", placeholder: "예: 5,000만원 / 미정" },
    { name: "period", label: "사업 기간", type: "text", group: "detail", placeholder: "예: 2026.03 ~ 2026.11" },
    { name: "trackRecord", label: "수행 실적·강점", type: "textarea", group: "presenter", placeholder: "유사 사업 수행 경험, 보유 역량 등" },
    ...PRESENTER_FIELDS.filter((f) => ["presenterOrg", "contact"].includes(f.name)),
    ...DETAIL_FIELDS,
  ],
  designAffinity: ["public_bid_formal", "simplep_mono", "public_data", "ocean_depths", "modern_minimalist", "simplep_ink"],
  researchAngles: ["사업 공고", "정책 방향", "유사 사업 사례"],
  sections: [
    { id: "cover", title: "표지", purpose: "사업명·제안 기관·제출일.", layouts: ["cover"], weight: 1, fixed: true },
    { id: "summary", title: "제안 개요", purpose: "제안의 핵심을 한 장으로 요약한다. 무엇을, 누구에게, 어떻게, 무슨 성과로 하는지 담는다.", layouts: ["table", "bullets", "stats"], weight: 1 },
    { id: "background", title: "추진 배경과 필요성", purpose: "발주 기관이 처한 상황과 정책·시장 흐름을 근거와 함께 제시한다. 반드시 출처가 있는 사실로 쓴다.", layouts: ["bullets", "stats", "compare"], weight: 2, research: true },
    { id: "problem", title: "문제 정의", purpose: "해결해야 할 문제를 구체적으로 규정한다. 막연한 서술 대신 현재 방식의 한계를 짚는다.", layouts: ["compare", "bullets", "stats"], weight: 2, research: true },
    { id: "solution", title: "해결 방안", purpose: "제안하는 해결책의 구조와 차별점. 왜 이 방식이 문제를 푸는지 논리를 보여준다.", layouts: ["process", "cards", "compare"], weight: 3 },
    { id: "plan", title: "세부 추진 계획", purpose: "실제 수행 내용을 단계·과업 단위로 구체화한다. 누가 무엇을 언제 하는지 드러난다.", layouts: ["table", "process", "bullets"], weight: 3 },
    { id: "schedule", title: "추진 일정", purpose: "사업 기간 전체의 일정표. 주요 마일스톤과 산출물 시점을 표시한다.", layouts: ["timeline", "table"], weight: 1 },
    { id: "org", title: "추진 체계와 역할", purpose: "수행 조직과 역할 분담, 발주 기관 협조사항을 명확히 한다.", layouts: ["cards", "table", "process"], weight: 1 },
    { id: "budget", title: "예산 계획", purpose: "예산 항목과 산정 근거를 표로 제시한다. 실제 금액을 모르면 산정 기준만 쓰고 금액은 [기관 확인 필요]로 둔다.", layouts: ["table", "stats"], weight: 1 },
    { id: "effect", title: "기대효과와 성과지표", purpose: "정량·정성 성과를 측정 가능한 지표로 제시한다. 근거 없는 수치를 지어내지 않는다.", layouts: ["stats", "table", "compare"], weight: 2 },
    { id: "credential", title: "수행 역량과 실적", purpose: "제안 기관이 이 사업을 해낼 수 있다는 근거. 유사 실적과 보유 역량을 제시한다.", layouts: ["cards", "table", "profile"], weight: 1 },
    { id: "risk", title: "위험 관리", purpose: "예상되는 위험 요인과 대응 방안을 짝지어 제시한다.", layouts: ["table", "compare"], weight: 1 },
    { id: "closing", title: "맺음말", purpose: "제안 요지 재확인과 연락처.", layouts: ["closing"], weight: 1, fixed: true },
  ],
};

const COMPANY: DocTypeSpec = {
  id: "company",
  label: "회사 소개서",
  tagline: "연혁·제품·실적·인증까지 회사의 전부",
  description: "회사 정보를 입력하면 개요·연혁·사업영역·경쟁력·실적·인증을 구조화해 신뢰감 있는 소개서로 만듭니다.",
  sizing: { mode: "scope", min: 8, max: 24, fallback: 14 },
  fields: [
    { name: "topic", label: "소개서 제목", type: "text", required: true, group: "core", placeholder: "예: 주식회사 OOO 회사소개서" },
    { name: "institutionName", label: "회사명", type: "text", required: true, group: "core", placeholder: "예: 주식회사 OOO" },
    { name: "institutionUrl", label: "홈페이지 URL", type: "text", group: "core", placeholder: "https://…", help: "입력하면 실제 사이트를 조사해 내용과 브랜드 색을 반영해요." },
    ...SCOPE_FIELDS,
    { name: "ceoName", label: "대표자명", type: "text", group: "company", placeholder: "예: 홍길동" },
    { name: "ceoMessage", label: "대표 인사말 / 경영 철학", type: "textarea", group: "company", placeholder: "고객에게 전하고 싶은 메시지" },
    { name: "foundedYear", label: "설립 연도", type: "text", group: "company", placeholder: "예: 2015" },
    { name: "history", label: "주요 연혁", type: "textarea", group: "company", placeholder: "예: 2015 법인 설립 / 2018 특허 취득 / 2022 매출 100억 달성", help: "한 줄에 하나씩, '연도 내용' 형식으로 적으면 연혁 슬라이드로 만들어요." },
    { name: "businessArea", label: "사업 영역·제품", type: "textarea", group: "company", placeholder: "주력 제품·서비스를 쉼표 또는 줄바꿈으로 구분해 입력" },
    { name: "strength", label: "핵심 경쟁력", type: "textarea", group: "company", placeholder: "기술력, 가격, 납기, 품질 등 경쟁사 대비 강점" },
    { name: "clients", label: "주요 거래처·고객사", type: "textarea", group: "company", placeholder: "예: 삼성전자, 현대자동차, 창원시청" },
    { name: "certifications", label: "인증·특허·수상", type: "textarea", group: "company", placeholder: "예: ISO 9001, 벤처기업 인증, 특허 3건" },
    { name: "scale", label: "회사 규모", type: "text", group: "company", placeholder: "예: 임직원 45명, 연매출 120억" },
    { name: "contact", label: "연락처·주소", type: "textarea", group: "company", placeholder: "전화, 이메일, 본사 주소" },
    ...DETAIL_FIELDS,
  ],
  designAffinity: ["premium_editorial", "simplep_mono", "modern_minimalist", "ocean_depths", "corporate_strategy", "midnight_galaxy"],
  researchAngles: ["회사 소개", "주요 제품", "매출 실적"],
  sections: [
    { id: "cover", title: "표지", purpose: "회사명과 슬로건 중심의 표지.", layouts: ["cover"], weight: 1, fixed: true },
    { id: "overview", title: "회사 한눈에 보기", purpose: "설립연도·대표·인원·매출·소재지 등 회사 기본 정보를 지표와 표로 압축한다.", layouts: ["stats", "table"], weight: 1 },
    { id: "ceo", title: "대표 인사말", purpose: "대표의 메시지와 경영 철학. 입력된 인사말이 있으면 그대로 다듬어 쓰고, 없으면 지어내지 않는다.", layouts: ["quote", "profile"], weight: 1 },
    { id: "vision", title: "미션과 비전", purpose: "회사가 지향하는 방향을 짧고 선명한 문장으로 제시한다.", layouts: ["bullets", "cards", "quote"], weight: 1 },
    { id: "history", title: "연혁", purpose: "설립부터 현재까지의 주요 이정표를 시간순으로 보여준다. 입력된 연혁만 사용한다.", layouts: ["timeline"], weight: 1 },
    { id: "business", title: "사업 영역", purpose: "주력 사업과 제품·서비스를 병렬로 소개한다. 각각 무엇이고 누구에게 파는지 명확히 한다.", layouts: ["cards", "table", "bullets"], weight: 3, research: true },
    { id: "strength", title: "핵심 경쟁력", purpose: "경쟁사 대비 우위를 근거와 함께 제시한다. 자화자찬 대신 확인 가능한 사실로 쓴다.", layouts: ["compare", "cards", "stats"], weight: 2, research: true },
    { id: "credential", title: "인증·특허·수상", purpose: "보유한 인증, 특허, 수상 실적을 정리한다. 입력된 것만 쓴다.", layouts: ["table", "cards", "bullets"], weight: 1 },
    { id: "clients", title: "주요 실적과 거래처", purpose: "대표 고객사와 납품·수행 실적을 제시한다. 입력되지 않은 거래처를 지어내지 않는다.", layouts: ["cards", "table", "stats"], weight: 2 },
    { id: "partnership", title: "협력 제안", purpose: "함께 일하면 상대가 얻는 것을 제시하고 다음 행동을 요청한다.", layouts: ["bullets", "process", "cards"], weight: 1 },
    { id: "closing", title: "연락처", purpose: "회사 연락처와 담당자 정보.", layouts: ["closing"], weight: 1, fixed: true },
  ],
};

const IR: DocTypeSpec = {
  id: "ir",
  label: "투자·IR 자료",
  tagline: "문제 → 솔루션 → 시장 → 트랙션 → 요청",
  description: "투자 심사역이 판단하는 순서를 그대로 따릅니다. 시장 규모, 성장 근거, 팀, 투자 요청까지 IR 표준 구조로 구성합니다.",
  sizing: { mode: "scope", min: 10, max: 20, fallback: 14 },
  fields: [
    { name: "topic", label: "회사·서비스명", type: "text", required: true, group: "core", placeholder: "예: OOO — AI 기반 재고관리 SaaS" },
    { name: "institutionName", label: "회사명", type: "text", required: true, group: "core" },
    { name: "institutionUrl", label: "홈페이지 URL", type: "text", group: "core", placeholder: "https://…" },
    ...SCOPE_FIELDS,
    { name: "oneLiner", label: "한 줄 소개", type: "text", group: "company", placeholder: "예: 소상공인을 위한 AI 재고관리 서비스" },
    { name: "problem", label: "해결하려는 문제", type: "textarea", group: "company", placeholder: "고객이 겪는 실제 불편" },
    { name: "solution", label: "솔루션", type: "textarea", group: "company", placeholder: "우리 제품이 그 문제를 어떻게 푸는지" },
    { name: "marketSize", label: "시장 규모", type: "textarea", group: "company", placeholder: "예: 국내 TAM 1.2조원 / 근거 자료 있으면 함께" },
    { name: "businessModel", label: "수익 모델", type: "textarea", group: "company", placeholder: "어떻게 돈을 버는지" },
    { name: "traction", label: "현재 성과(트랙션)", type: "textarea", group: "company", placeholder: "예: MAU 3만, 월매출 8천만원, 재구매율 62%" },
    { name: "competition", label: "경쟁사와 차별점", type: "textarea", group: "company" },
    { name: "team", label: "팀 소개", type: "textarea", group: "company", placeholder: "핵심 멤버의 이름·역할·경력" },
    { name: "ask", label: "투자 요청 사항", type: "textarea", group: "company", placeholder: "예: 시리즈A 20억 / 자금 사용 계획" },
    ...DETAIL_FIELDS,
  ],
  designAffinity: ["tech_innovation", "simplep_mono", "modern_minimalist", "tech_neon", "midnight_galaxy", "corporate_strategy"],
  researchAngles: ["시장 규모", "경쟁사", "투자 유치"],
  sections: [
    { id: "cover", title: "표지", purpose: "회사명과 한 줄 소개.", layouts: ["cover"], weight: 1, fixed: true },
    { id: "oneliner", title: "한 문장 소개", purpose: "무엇을 하는 회사인지 한 문장으로 각인시킨다.", layouts: ["quote", "bullets"], weight: 1 },
    { id: "problem", title: "문제", purpose: "고객이 겪는 문제의 크기와 절박함을 근거와 함께 보여준다.", layouts: ["stats", "bullets", "compare"], weight: 2, research: true },
    { id: "solution", title: "솔루션", purpose: "제품이 그 문제를 어떻게 해결하는지 구조로 보여준다.", layouts: ["process", "cards", "compare"], weight: 2 },
    { id: "product", title: "제품", purpose: "실제 제품의 핵심 기능과 사용 흐름을 보여준다.", layouts: ["cards", "process", "table"], weight: 2 },
    { id: "market", title: "시장 기회", purpose: "TAM/SAM/SOM과 성장률을 제시한다. 출처 없는 시장 규모를 지어내지 않는다.", layouts: ["stats", "table", "compare"], weight: 2, research: true },
    { id: "model", title: "비즈니스 모델", purpose: "수익 구조와 단가·마진을 명확히 한다.", layouts: ["process", "table", "cards"], weight: 1 },
    { id: "traction", title: "트랙션", purpose: "지금까지의 실제 성과를 숫자로 제시한다. 입력된 실적만 사용한다.", layouts: ["stats", "table"], weight: 2 },
    { id: "moat", title: "경쟁 우위", purpose: "경쟁사 대비 방어 가능한 강점을 비교로 제시한다.", layouts: ["compare", "table", "cards"], weight: 1, research: true },
    { id: "roadmap", title: "성장 로드맵", purpose: "향후 12~24개월 마일스톤을 시간순으로 제시한다.", layouts: ["timeline", "process"], weight: 1 },
    { id: "team", title: "팀", purpose: "핵심 멤버의 역량이 이 사업에 왜 적합한지 보여준다.", layouts: ["profile", "cards"], weight: 1 },
    { id: "ask", title: "투자 요청", purpose: "요청 금액과 자금 사용 계획, 그로 달성할 목표를 명시한다.", layouts: ["stats", "table", "bullets"], weight: 1 },
    { id: "closing", title: "맺음말", purpose: "연락처와 다음 미팅 제안.", layouts: ["closing"], weight: 1, fixed: true },
  ],
};

const REPORT: DocTypeSpec = {
  id: "report",
  label: "결과 보고서",
  tagline: "경과 → 결과 → 성과분석 → 시사점",
  description: "수행한 사업의 결과를 정량·정성으로 정리하고, 분석과 시사점, 향후 계획까지 보고서 형식으로 구성합니다.",
  sizing: { mode: "scope", min: 8, max: 24, fallback: 14 },
  fields: [
    ...COMMON_CORE,
    ...SCOPE_FIELDS,
    { name: "period", label: "사업 기간", type: "text", group: "detail", placeholder: "예: 2026.03 ~ 2026.11" },
    { name: "results", label: "주요 실적·수치", type: "textarea", group: "detail", placeholder: "예: 교육 12회, 수료 240명, 만족도 4.6/5", help: "실제 수치를 넣으면 그 값으로만 지표 슬라이드를 만들어요." },
    { name: "issues", label: "문제점·개선사항", type: "textarea", group: "detail" },
    { name: "nextPlan", label: "향후 계획", type: "textarea", group: "detail" },
    ...PRESENTER_FIELDS.filter((f) => ["presenterOrg", "contact"].includes(f.name)),
    ...DETAIL_FIELDS,
  ],
  designAffinity: ["public_data", "simplep_ink", "modern_minimalist", "public_bid_formal", "ocean_depths", "simplep_mono"],
  researchAngles: ["사업 결과", "성과 지표", "평가"],
  sections: [
    { id: "cover", title: "표지", purpose: "사업명·수행 기관·보고일.", layouts: ["cover"], weight: 1, fixed: true },
    { id: "summary", title: "요약", purpose: "보고서 전체를 한 장으로 요약한다. 무엇을 했고 무슨 성과가 났는지 핵심만 담는다.", layouts: ["stats", "bullets", "table"], weight: 1 },
    { id: "overview", title: "사업 개요", purpose: "사업의 목적·대상·기간·규모를 표로 정리한다.", layouts: ["table", "bullets"], weight: 1 },
    { id: "progress", title: "추진 경과", purpose: "사업 진행 과정을 시간순으로 정리한다.", layouts: ["timeline", "table", "process"], weight: 2 },
    { id: "results", title: "주요 결과", purpose: "수행한 활동과 산출물을 구체적으로 제시한다.", layouts: ["cards", "table", "bullets"], weight: 3 },
    { id: "quant", title: "정량 성과", purpose: "숫자로 확인되는 성과. 입력된 실제 수치만 사용하고, 없으면 지표 항목만 두고 값은 [확인 필요]로 표시한다.", layouts: ["stats", "table"], weight: 2 },
    { id: "qual", title: "정성 성과와 사례", purpose: "참여자 반응, 변화 사례 등 숫자로 표현되지 않는 성과.", layouts: ["quote", "cards", "bullets"], weight: 2 },
    { id: "analysis", title: "분석과 시사점", purpose: "결과가 의미하는 바를 해석하고, 잘된 점과 한계를 짚는다.", layouts: ["compare", "bullets", "table"], weight: 2, research: true },
    { id: "improve", title: "개선사항", purpose: "다음 회차에 바꿔야 할 점을 구체적 실행 항목으로 제시한다.", layouts: ["table", "bullets", "compare"], weight: 1 },
    { id: "next", title: "향후 계획", purpose: "이어질 계획과 필요한 지원을 제시한다.", layouts: ["process", "timeline", "bullets"], weight: 1 },
    { id: "closing", title: "맺음말", purpose: "감사 인사와 담당자 연락처.", layouts: ["closing"], weight: 1, fixed: true },
  ],
};

// ---------------------------------------------------------------------------

export const DOC_TYPES: DocTypeSpec[] = [LECTURE, WORKSHOP, PROPOSAL, COMPANY, IR, REPORT, ...OUTLINE_CATALOG_TYPES];

const BY_ID = new Map<DocType, DocTypeSpec>(DOC_TYPES.map((d) => [d.id, d]));

export function getDocTypeSpec(id: DocType): DocTypeSpec {
  const spec = BY_ID.get(id);
  if (!spec) throw new Error(`알 수 없는 문서 유형이에요: ${id}`);
  return spec;
}

export function isDocType(value: unknown): value is DocType {
  return typeof value === "string" && BY_ID.has(value as DocType);
}
