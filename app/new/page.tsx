"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { DocType, GeneratedDeck } from "@/lib/types";

const DOC_TYPE_OPTIONS: { value: DocType; label: string; hint: string }[] = [
  { value: "proposal", label: "제안서", hint: "기관 유형에 맞는 목차로 자동 구성돼요" },
  { value: "presentation", label: "발표 PPT", hint: "강의·발표용 슬라이드 흐름" },
  { value: "intro", label: "회사·강사 소개서", hint: "본인/서비스 소개용" },
];

const LAYOUT_LABEL: Record<string, string> = {
  cover: "표지",
  divider: "구분",
  bullets: "목록",
  compare: "비교",
  process: "단계",
  stats: "통계",
  table: "표",
  quote: "인용",
  closing: "마무리",
};

export default function NewProjectPage() {
  const [docType, setDocType] = useState<DocType>("proposal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDeck(null);

    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.docType = docType;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "생성에 실패했어요.");
      setDeck(json.deck as GeneratedDeck);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 홈으로
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">새 문서 만들기</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">문서 종류</label>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setDocType(opt.value)}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  docType === opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                <div className="font-semibold">{opt.label}</div>
                <div className={`mt-0.5 text-xs ${docType === opt.value ? "text-zinc-300" : "text-zinc-500"}`}>
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Field name="topic" label="주제" required placeholder="예: 생성형 AI 업무 활용 교육" />
        <Field name="institutionName" label="대상 기관명" required placeholder="예: 창원시 청년센터" />
        <Field name="institutionUrl" label="기관 홈페이지 URL (선택)" placeholder="https://..." />
        <div className="grid grid-cols-2 gap-4">
          <Field name="audience" label="대상·청중" placeholder="예: 청년 소상공인 20명" />
          <Field name="durationMinutes" label="교육/발표 시간(분)" type="number" placeholder="120" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field name="slideCount" label="슬라이드 수 (선택)" type="number" placeholder="자동" />
          <Field name="tone" label="문체" placeholder="예: 쉽고 친절하게" />
        </div>
        <Field
          name="mustInclude"
          label="반드시 포함할 내용 (선택)"
          placeholder="예: 실습은 스마트폰 위주로, SNS 게시물 만들기 포함"
          textarea
        />

        <fieldset className="rounded-xl border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">발표자 / 강사 정보</legend>
          <div className="grid grid-cols-2 gap-4">
            <Field name="presenterName" label="이름" placeholder="예: 문정수" />
            <Field name="presenterTitle" label="직함" placeholder="예: AI 강사" />
            <Field name="presenterOrg" label="소속" placeholder="예: OO AI콘텐츠연구원" />
            <Field name="contact" label="연락처" placeholder="이메일 또는 전화번호" />
          </div>
          <Field name="presenterBio" label="소개 (선택)" textarea placeholder="경력, 실적 등" />
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "만드는 중이에요..." : "PPT 생성하기"}
        </button>
      </form>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {deck && (
        <div className="mt-8 rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{deck.fileName}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                유형: {deck.classification.label} · {deck.classification.reason}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                디자인: {deck.design.label} {deck.usedLlm ? "· AI 생성" : "· 기본 템플릿(AI 키 없음)"}
              </p>
            </div>
            <a
              href={`/api/download/${deck.id}`}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              .pptx 다운로드
            </a>
          </div>

          <div className="mt-4 flex gap-2">
            {[deck.design.background, deck.design.primary, ...deck.design.accent].map((c, i) => (
              <div key={i} className="h-8 w-8 rounded-full border border-zinc-200" style={{ backgroundColor: `#${c}` }} />
            ))}
          </div>

          {deck.qa.issues.length > 0 && (
            <div className="mt-4 space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {deck.qa.issues.map((issue, i) => (
                <div key={i}>
                  {issue.severity === "error" ? "⚠️" : "ℹ️"} {issue.message}
                </div>
              ))}
            </div>
          )}

          <ol className="mt-4 space-y-1.5">
            {deck.slides.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-700">
                <span className="w-16 shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-center text-xs text-zinc-500">
                  {LAYOUT_LABEL[s.layout] ?? s.layout}
                </span>
                <span>{s.title || s.quote || "-"}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  required,
  placeholder,
  type = "text",
  textarea = false,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  const common =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none";
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={2} className={common} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} className={common} />
      )}
    </div>
  );
}
