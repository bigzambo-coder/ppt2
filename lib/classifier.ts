import { InstitutionClassification, InstitutionType } from "./types";

interface Rule {
  type: InstitutionType;
  label: string;
  keywords: string[];
}

// Priority order matters: checked top to bottom. Source: 기획서_자동생성_코덱스용.md §3-1.
const RULES: Rule[] = [
  {
    type: "public_bid",
    label: "공공기관 교육용역 입찰",
    keywords: ["입찰", "제안요청서", "RFP", "나라장터", "정량평가", "정성평가"],
  },
  {
    type: "corporate",
    label: "기업·중소기업 교육",
    keywords: ["임직원", "부서", "업무효율", "사내교육", "현업 적용", "현업적용"],
  },
  {
    type: "small_business",
    label: "소상공인 지원교육",
    keywords: ["소상공인", "자영업자", "점포", "매장", "상권"],
  },
  {
    type: "school",
    label: "학교·대학 교육",
    keywords: ["학생", "학년", "교사", "학교", "대학", "비교과", "진로"],
  },
  {
    type: "event",
    label: "행사·특강",
    keywords: ["행사", "특강", "세미나", "설명회", "모집", "접수"],
  },
];

const FALLBACK: { type: InstitutionType; label: string } = {
  type: "public_general",
  label: "공공기관·지자체 일반교육",
};

/**
 * Classifies a proposal request into one of the 6 institution types (A~F)
 * defined in 기획서_자동생성_코덱스용.md. Runs on the combined free-text the
 * user supplies (institution name, topic, audience, must-include notes).
 */
export function classifyInstitution(input: {
  institutionName: string;
  topic: string;
  audience?: string;
  mustInclude?: string;
}): InstitutionClassification {
  const haystack = [input.institutionName, input.topic, input.audience, input.mustInclude]
    .filter(Boolean)
    .join(" ");

  for (const rule of RULES) {
    const matched = rule.keywords.filter((kw) => haystack.includes(kw));
    if (matched.length > 0) {
      return {
        type: rule.type,
        label: rule.label,
        reason: `"${matched.join(", ")}" 표현이 확인되어 ${rule.label} 유형으로 분류했어요.`,
        matchedKeywords: matched,
      };
    }
  }

  return {
    type: FALLBACK.type,
    label: FALLBACK.label,
    reason: "특정 유형을 가리키는 표현이 없어 기본값인 공공기관·지자체 일반교육 유형으로 분류했어요.",
    matchedKeywords: [],
  };
}
