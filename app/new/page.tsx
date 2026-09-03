"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DesignToken, DocType } from "@/lib/types";
import type { PlannedSlide } from "@/lib/content/blueprint";
import { SlidePreview } from "@/app/deck/[id]/SlidePreview";
import { DOC_TYPES, getDocTypeSpec } from "@/lib/doctypes/registry";
import { FIELD_GROUP_LABEL, IntakeField, resolveSlideCount } from "@/lib/doctypes/spec";

const GROUP_ORDER: IntakeField["group"][] = ["core", "audience", "company", "presenter", "detail"];
type PlanResult = {
  plan: PlannedSlide[];
  sources: { id: string; title: string; publisher: string }[];
  designs: { variant: number; token: DesignToken }[];
  slideCount: number;
  outlineError?: string;
};
type InterviewQuestion = { id: string; label: string; why: string; type: "text" | "textarea" | "select"; options?: string[]; required: boolean };
type SampleResult = { slides: import("@/lib/types").SlideContent[]; sourceIndices: number[]; design: DesignToken; usedLlm: boolean; error?: string };

export default function NewProjectPage({ initialDocType = null }: { initialDocType?: DocType | null } = {}) {
  const router = useRouter();
  const [docType, setDocType] = useState<DocType | null>(initialDocType);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[] | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [sampleResult, setSampleResult] = useState<SampleResult | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: { aiReady?: boolean }) => setAiReady(Boolean(data.aiReady)))
      .catch(() => setAiReady(null));
  }, []);

  const spec = docType ? getDocTypeSpec(docType) : null;

  // Live estimate so the user sees the time→slides rule working as they type.
  const estimate = useMemo(() => {
    if (!spec) return null;
    return resolveSlideCount(spec, {
      slideCount: Number(values.slideCount) || undefined,
      durationMinutes: Number(values.durationMinutes) || undefined,
    });
  }, [spec, values.slideCount, values.durationMinutes]);

  const grouped = useMemo(() => {
    if (!spec) return [];
    return GROUP_ORDER.map((group) => ({
      group,
      fields: spec.fields.filter((f) => f.group === group),
    })).filter((g) => g.fields.length > 0);
  }, [spec]);

  async function requestPlan() {
    if (!spec) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: spec.id, fields: enrichedFields() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "조사와 목차 설계에 실패했어요.");
      setPlanResult(json as PlanResult);
      setSelectedVariant(json.designs?.[0]?.variant ?? 0);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!spec) return;
    if (spec.id !== "lecture") return requestPlan();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docType: spec.id, fields: values }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "맞춤 질문 생성에 실패했어요.");
      setInterviewQuestions(json.questions ?? []); setLoading(false);
    } catch (err) { setError(err instanceof Error ? err.message : "맞춤 질문 생성에 실패했어요."); setLoading(false); }
  }

  function enrichedFields() {
    const interview = interviewQuestions?.map((q) => `${q.label}: ${interviewAnswers[q.id] || "답변 없음"}`).join("\n") ?? "";
    return interview ? { ...values, aiInterview: interview } : values;
  }

  async function createSample() {
    if (!spec || !planResult) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/sample", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docType: spec.id, fields: enrichedFields(), approvedPlan: planResult.plan, designVariant: selectedVariant }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "대표 시안 생성에 실패했어요.");
      setSampleResult(json as SampleResult); setLoading(false);
    } catch (err) { setError(err instanceof Error ? err.message : "대표 시안 생성에 실패했어요."); setLoading(false); }
  }

  async function generateApprovedDeck() {
    if (!spec || !planResult) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: spec.id, fields: enrichedFields(), approvedPlan: planResult.plan, designVariant: selectedVariant }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "최종 PPT 생성에 실패했어요.");
      router.push(`/deck/${json.deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요."); setLoading(false);
    }
  }

  // ---- Step 1: pick the document type ------------------------------------
  if (!spec) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← 홈으로
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">어떤 문서를 만들까요?</h1>
        <p className="mt-1 text-sm text-zinc-500">
          유형을 고르면 그 유형에 필요한 항목만 물어보고, 구성·장수·디자인을 자동으로 맞춰요.
        </p>

        <div className="mt-6 space-y-3">
          {DOC_TYPES.map((d) => (
            <Link
              key={d.id}
              href={`/new/${d.id}`}
              className="flex w-full items-start justify-between gap-4 rounded-xl border border-zinc-200 p-5 text-left transition hover:border-zinc-900 hover:bg-zinc-50"
            >
              <span>
                <span className="block font-semibold text-zinc-900">{d.label}</span>
                <span className="mt-0.5 block text-xs font-medium text-zinc-500">{d.tagline}</span>
                <span className="mt-2 block text-sm text-zinc-600">{d.description}</span>
                <span className="mt-2 block text-xs text-zinc-400">
                  {d.sizing.mode === "time" ? "시간 기준 자동 편성" : `표준 ${d.sizing.fallback}장 내외`} ·{" "}
                  {d.sections.length}개 섹션 구성
                </span>
              </span>
              <span className="mt-1 shrink-0 text-zinc-300">→</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (interviewQuestions && !planResult) {
    const missing = interviewQuestions.some((q) => q.required && !interviewAnswers[q.id]?.trim());
    return <div className="mx-auto min-h-screen max-w-3xl px-6 py-10 text-zinc-900">
      <button onClick={() => setInterviewQuestions(null)} className="text-sm text-zinc-500 hover:underline">← 기본 정보 수정</button>
      <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-emerald-700">HIGH QUALITY · STEP 2</p>
      <h1 className="mt-1 text-3xl font-bold">AI가 강의 품질에 필요한 내용을 질문합니다</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">이미 입력한 내용은 다시 묻지 않습니다. 답변은 조사·목차·실습·시각자료 계획에 함께 반영됩니다.</p>
      <div className="mt-8 space-y-5">{interviewQuestions.map((q, i) => <label key={q.id} className="block rounded-2xl border border-zinc-200 p-5">
        <span className="text-xs font-bold text-emerald-700">QUESTION {i + 1}</span><span className="mt-1 block text-lg font-bold">{q.label}{q.required && <span className="text-red-500"> *</span>}</span><span className="mt-1 block text-xs text-zinc-400">{q.why}</span>
        {q.type === "select" ? <select value={interviewAnswers[q.id] ?? ""} onChange={(e) => setInterviewAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="mt-4 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"><option value="">선택해 주세요</option>{q.options?.map((o) => <option key={o}>{o}</option>)}</select> : q.type === "textarea" ? <textarea rows={4} value={interviewAnswers[q.id] ?? ""} onChange={(e) => setInterviewAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-3 leading-relaxed" /> : <input value={interviewAnswers[q.id] ?? ""} onChange={(e) => setInterviewAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-3" />}
      </label>)}</div>
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <button onClick={requestPlan} disabled={loading || missing} className="mt-8 w-full rounded-full bg-zinc-900 px-6 py-3 font-medium text-white disabled:opacity-40">{loading ? "답변을 분석하고 조사하는 중…" : "답변 분석·자료 조사·맞춤 목차 만들기"}</button>
    </div>;
  }

  if (sampleResult && planResult) {
    return <div className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-zinc-900">
      <button onClick={() => setSampleResult(null)} className="text-sm text-zinc-500 hover:underline">← 목차와 디자인 다시 선택</button>
      <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-emerald-700">HIGH QUALITY · STEP 4</p><h1 className="mt-1 text-3xl font-bold">대표 슬라이드 3장을 먼저 확인하세요</h1><p className="mt-2 text-sm text-zinc-500">표지·핵심 설명·실습 시안입니다. 승인하면 같은 디자인 체계로 전체 덱을 제작합니다.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">{sampleResult.slides.map((slide, i) => <div key={i}><div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-lg"><SlidePreview slide={slide} design={sampleResult.design} /></div><p className="mt-2 text-sm font-semibold">전체 목차 {sampleResult.sourceIndices[i] + 1}번 · {slide.title}</p><p className="text-xs text-zinc-400">{slide.layout}</p></div>)}</div>
      {sampleResult.error && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{sampleResult.error}</p>}{error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex gap-3"><button onClick={() => setSampleResult(null)} className="rounded-full border border-zinc-300 px-6 py-3">시안 다시 선택</button><button onClick={generateApprovedDeck} disabled={loading || !sampleResult.usedLlm} className="flex-1 rounded-full bg-zinc-900 px-6 py-3 font-medium text-white disabled:opacity-40">{loading ? "전체 PPT 제작·검수 중…" : "시안 승인하고 전체 PPT 만들기"}</button></div>
    </div>;
  }

  if (planResult) {
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-10 text-zinc-900">
        <button onClick={() => setPlanResult(null)} className="text-sm text-zinc-500 hover:underline">← 입력 내용 수정</button>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold tracking-[0.18em] text-emerald-700">HIGH QUALITY · STEP 2</p><h1 className="mt-1 text-3xl font-bold">조사 결과와 맞춤 목차를 확인하세요</h1><p className="mt-2 text-sm text-zinc-500">승인한 목차와 디자인으로만 최종 PPT를 제작합니다.</p></div>
          <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm">{planResult.slideCount}장 · 출처 {planResult.sources.length}건</div>
        </div>

        {planResult.sources.length === 0 ? <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">관련 조사 출처를 확보하지 못했습니다. 통계·실제 사례·외부 이미지는 사용하지 않습니다.</div> : (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">조사 출처 {planResult.sources.length}건 확보</p><p className="mt-1 text-xs text-emerald-800">{planResult.sources.slice(0, 3).map((s) => s.title).join(" · ")}</p></div>
        )}

        <section className="mt-8"><h2 className="text-xl font-bold">1. 디자인 방향 선택</h2><div className="mt-3 grid gap-3 md:grid-cols-3">{planResult.designs.map(({ variant, token }) => (
          <button key={variant} onClick={() => setSelectedVariant(variant)} className={`overflow-hidden rounded-2xl border-2 text-left transition ${selectedVariant === variant ? "border-zinc-900 shadow-lg" : "border-zinc-200 hover:border-zinc-400"}`}>
            <div className="h-28 p-5" style={{ background: `#${token.background}`, color: `#${token.textPrimary}` }}><div className="h-1 w-12" style={{ background: `#${token.primary}` }} /><p className="mt-4 text-lg font-bold">{token.label}</p><p className="mt-1 text-xs opacity-70">{token.mood.join(" · ")}</p></div>
            <div className="flex gap-2 bg-white p-3">{[token.primary, ...token.accent, token.surface].map((color, i) => <span key={i} className="h-5 flex-1 rounded-full" style={{ background: `#${color}` }} />)}</div>
          </button>
        ))}</div></section>

        <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold">2. 페이지별 목차 승인</h2><p className="mt-1 text-sm text-zinc-500">각 장의 메시지와 시각자료 계획을 먼저 검토합니다.</p></div><button onClick={requestPlan} disabled={loading} className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">목차 다시 설계</button></div>
          <div className="mt-4 space-y-3">{planResult.plan.map((p) => <article key={p.index} className="grid gap-3 rounded-2xl border border-zinc-200 p-5 md:grid-cols-[3rem_1fr_1fr]">
            <div className="text-2xl font-bold text-zinc-300">{String(p.index + 1).padStart(2, "0")}</div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{p.sectionTitle}</h3><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">{p.layouts[0]}</span></div><p className="mt-2 text-sm leading-relaxed text-zinc-600">{p.purpose}</p></div><div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold tracking-wider text-emerald-700">VISUAL PLAN</p><p className="mt-1 text-sm leading-relaxed text-zinc-700">{p.visualBrief}</p><p className="mt-2 text-xs text-zinc-400">근거: {p.evidenceNeed}</p></div>
          </article>)}</div>
        </section>
        {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="sticky bottom-4 mt-8 flex gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur"><button onClick={() => { setPlanResult(null); setInterviewQuestions(null); }} className="rounded-full border border-zinc-300 px-6 py-3 text-sm">입력 수정</button><button onClick={createSample} disabled={loading} className="flex-1 rounded-full bg-zinc-900 px-6 py-3 font-medium text-white disabled:opacity-50">{loading ? "대표 3장 시안을 만드는 중…" : "목차 승인하고 대표 3장 시안 보기"}</button></div>
      </div>
    );
  }

  // ---- Step 2: the type-specific intake form -----------------------------
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <button onClick={() => setDocType(null)} className="text-sm text-zinc-500 hover:underline">
        ← 유형 다시 고르기
      </button>

      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">{spec.label}</h1>
        {estimate !== null && (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            예상 {estimate}장
          </span>
        )}
      </div>
      <div className={`mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${aiReady === false ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
        {aiReady === true ? (
          <>✓ AI 연결 완료 — 예상 장수만큼 내용과 시각자료를 생성할 수 있습니다.</>
        ) : aiReady === false ? (
          <>AI 키(<code className="font-mono">ANTHROPIC_API_KEY</code>)가 없습니다. 현재는 섹션당 1장짜리 <b>{spec.sections.length}장 뼈대</b>만 생성됩니다.</>
        ) : (
          <>AI 연결 상태를 확인하고 있습니다…</>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-500">{spec.description}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {grouped.map(({ group, fields }) => (
          <fieldset key={group} className="rounded-xl border border-zinc-200 p-4">
            <legend className="px-1 text-sm font-medium text-zinc-700">{FIELD_GROUP_LABEL[group]}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-zinc-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm leading-relaxed focus:border-zinc-900 focus:outline-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                    />
                  )}
                  {field.help && <p className="mt-1 text-xs text-zinc-400">{field.help}</p>}
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-xs font-medium text-zinc-600">이 유형의 구성 순서</p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            {spec.sections.map((s) => s.title).join(" → ")}
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "주제에 맞는 질문을 설계하는 중이에요…" : spec.id === "lecture" ? "AI 맞춤 질문 시작" : "AI 조사·맞춤 목차 만들기"}
        </button>
        <p className="text-center text-xs text-zinc-400">
          먼저 조사 결과·목차·디자인을 승인한 뒤 최종 PPT를 만듭니다.
        </p>
      </form>
    </div>
  );
}
