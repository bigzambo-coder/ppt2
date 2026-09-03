"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DesignToken, GeneratedDeck, SlideContent } from "@/lib/types";
import { SlidePreview } from "./SlidePreview";

const LAYOUT_LABEL: Record<string, string> = {
  cover: "표지",
  agenda: "목차",
  divider: "구분",
  bullets: "목록",
  compare: "비교",
  process: "단계",
  stats: "지표",
  table: "표",
  quote: "인용",
  timeline: "연혁",
  cards: "카드",
  profile: "인물",
  closing: "마무리",
};

/** Structured slide data <-> "왼쪽 | 오른쪽" lines, so every layout is editable as plain text. */
const pairsToText = (rows: [string, string][]) => rows.map(([a, b]) => `${a} | ${b}`).join("\n");
const textToPairs = (text: string): [string, string][] =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("|");
      return i === -1 ? ([l, ""] as [string, string]) : ([l.slice(0, i).trim(), l.slice(i + 1).trim()] as [string, string]);
    });

export function DeckEditor({ initialDeck }: { initialDeck: GeneratedDeck }) {
  const [deck, setDeck] = useState(initialDeck);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<{ variant: number; token: DesignToken }[] | null>(null);

  const slide = deck.slides[selected];
  const errorCount = useMemo(() => deck.qa.issues.filter((i) => i.severity === "error").length, [deck.qa.issues]);

  // Arrow keys page through slides, but not while the user is typing in the
  // editor on the right.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") setSelected((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setSelected((i) => Math.min(deck.slides.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck.slides.length]);

  function patchSlide(changes: Partial<SlideContent>) {
    setDeck((d) => ({ ...d, slides: d.slides.map((s, i) => (i === selected ? { ...s, ...changes } : s)) }));
    setDirty(true);
  }

  async function save(designVariant?: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/deck/${deck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: deck.slides, designVariant }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장에 실패했어요.");
      setDeck(json.deck);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function loadAlternatives() {
    if (alternatives) return setAlternatives(null);
    const res = await fetch(`/api/deck/${deck.id}`, { method: "POST" });
    if (res.ok) setAlternatives((await res.json()).alternatives);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/projects" className="text-sm text-zinc-500 hover:underline">
            ← 지난 문서
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">{deck.brief.topic}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {deck.brief.institutionName} · {deck.slides.length}장 · {deck.design.label}
            {deck.usedLlm ? " · AI 작성" : deck.llmError ? " · AI 생성 실패" : " · 기본 구성(AI 키 없음)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAlternatives}
            className="rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            디자인 바꾸기
          </button>
          <button
            onClick={() => save()}
            disabled={saving || !dirty}
            className="rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
          >
            {saving ? "저장 중…" : dirty ? "수정 반영" : savedAt ? `저장됨 ${savedAt}` : "수정 없음"}
          </button>
          <a
            href={`/api/download/${deck.id}`}
            onClick={(e) => {
              if (dirty) {
                e.preventDefault();
                setError("수정한 내용이 있어요. '수정 반영'을 먼저 눌러 주세요.");
              }
            }}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            .pptx 다운로드
          </a>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {deck.llmError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          AI 생성이 실패해서 빈 뼈대로 만들어졌어요: {deck.llmError}
        </p>
      )}

      {alternatives && (
        <div className="mt-4 rounded-xl border border-zinc-200 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-700">이 문서 유형에 어울리는 디자인 조합</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt.variant}
                onClick={() => save(alt.variant)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition hover:border-zinc-900 ${
                  alt.token.id === deck.design.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                }`}
              >
                <span className="flex">
                  {[alt.token.primary, alt.token.accent[0], alt.token.surface].map((col, i) => (
                    <span key={i} className="h-5 w-5 rounded-full border border-white" style={{ background: `#${col}`, marginLeft: i ? -6 : 0 }} />
                  ))}
                </span>
                <span className="font-medium text-zinc-800">{alt.token.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {deck.qa.issues.length > 0 && (
        <div className={`mt-4 rounded-xl p-4 text-sm ${errorCount > 0 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>
          <p className="mb-1 font-medium">자동 검수 결과 {errorCount > 0 ? `· 오류 ${errorCount}건` : "· 참고사항"}</p>
          <ul className="space-y-0.5">
            {deck.qa.issues.map((issue, i) => (
              <li key={i}>
                <button
                  onClick={() => issue.slideIndex !== undefined && setSelected(issue.slideIndex)}
                  className={issue.slideIndex !== undefined ? "text-left underline-offset-2 hover:underline" : "text-left"}
                >
                  {issue.severity === "error" ? "⚠️" : "ℹ️"} {issue.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Big preview, navigated one slide at a time rather than by scrolling a
            long rail — with 40–60 slides the rail was unusable. */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected((i) => Math.max(0, i - 1))}
              disabled={selected === 0}
              aria-label="이전 슬라이드"
              className="shrink-0 rounded-full border border-zinc-300 px-3.5 py-2.5 text-lg leading-none text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
            >
              ‹
            </button>
            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
              <SlidePreview slide={slide} design={deck.design} />
            </div>
            <button
              onClick={() => setSelected((i) => Math.min(deck.slides.length - 1, i + 1))}
              disabled={selected === deck.slides.length - 1}
              aria-label="다음 슬라이드"
              className="shrink-0 rounded-full border border-zinc-300 px-3.5 py-2.5 text-lg leading-none text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
            >
              ›
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-sm font-medium text-zinc-700">
              {selected + 1} / {deck.slides.length}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              {LAYOUT_LABEL[slide.layout] ?? slide.layout}
            </span>
            <select
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-700 focus:border-zinc-900 focus:outline-none"
            >
              {deck.slides.map((s, i) => (
                <option key={i} value={i}>
                  {i + 1}. {s.title || LAYOUT_LABEL[s.layout]}
                </option>
              ))}
            </select>
          </div>

          {/* Compact dot strip: jump anywhere without a tall scrolling column. */}
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {deck.slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                title={`${i + 1}. ${s.title ?? ""}`}
                className={`h-6 w-6 rounded text-[10px] transition ${
                  i === selected
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">{selected + 1}번 슬라이드 편집</h2>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">{LAYOUT_LABEL[slide.layout]}</span>
          </div>

          <Field label="제목" value={slide.title ?? ""} onChange={(v) => patchSlide({ title: v })} />

          {(slide.layout === "cover" || slide.layout === "closing" || slide.layout === "divider") && (
            <Field label="부제" value={slide.subtitle ?? ""} onChange={(v) => patchSlide({ subtitle: v })} />
          )}

          {slide.layout === "bullets" && (
            <Area
              label="본문 (한 줄에 하나씩)"
              value={(slide.bullets ?? []).join("\n")}
              onChange={(v) => patchSlide({ bullets: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
            />
          )}

          {slide.layout === "cards" && (
            <Area
              label="카드 (제목 | 설명)"
              value={pairsToText((slide.cards ?? []).map((c) => [c.title, c.description]))}
              onChange={(v) => patchSlide({ cards: textToPairs(v).map(([title, description]) => ({ title, description })) })}
            />
          )}

          {slide.layout === "process" && (
            <Area
              label="단계 (제목 | 설명)"
              value={pairsToText((slide.steps ?? []).map((s) => [s.title, s.description]))}
              onChange={(v) => patchSlide({ steps: textToPairs(v).map(([title, description]) => ({ title, description })) })}
            />
          )}

          {slide.layout === "stats" && (
            <Area
              label="지표 (값 | 설명)"
              value={pairsToText((slide.stats ?? []).map((s) => [s.value, s.label]))}
              onChange={(v) => patchSlide({ stats: textToPairs(v).map(([value, label]) => ({ value, label })) })}
            />
          )}

          {(slide.layout === "timeline" || slide.layout === "agenda") && (
            <Area
              label={slide.layout === "agenda" ? "목차 (시간·번호 | 구간명)" : "연혁 (시점 | 내용)"}
              value={pairsToText((slide.milestones ?? []).map((m) => [m.when, m.what]))}
              onChange={(v) => patchSlide({ milestones: textToPairs(v).map(([when, what]) => ({ when, what })) })}
            />
          )}

          {slide.layout === "compare" &&
            (slide.columns ?? []).map((col, ci) => (
              <div key={ci} className="rounded-lg bg-zinc-50 p-2">
                <Field
                  label={`${ci + 1}번 열 제목`}
                  value={col.title}
                  onChange={(v) =>
                    patchSlide({ columns: (slide.columns ?? []).map((c, i) => (i === ci ? { ...c, title: v } : c)) })
                  }
                />
                <Area
                  label="항목 (한 줄에 하나씩)"
                  value={col.items.join("\n")}
                  onChange={(v) =>
                    patchSlide({
                      columns: (slide.columns ?? []).map((c, i) =>
                        i === ci ? { ...c, items: v.split("\n").map((s) => s.trim()).filter(Boolean) } : c
                      ),
                    })
                  }
                />
              </div>
            ))}

          {slide.layout === "table" && (
            <>
              <Field
                label="표 머리글 (쉼표로 구분)"
                value={(slide.table?.headers ?? []).join(", ")}
                onChange={(v) =>
                  patchSlide({ table: { headers: v.split(",").map((s) => s.trim()), rows: slide.table?.rows ?? [] } })
                }
              />
              <Area
                label="표 내용 (한 줄에 한 행, 쉼표로 열 구분)"
                value={(slide.table?.rows ?? []).map((r) => r.join(", ")).join("\n")}
                onChange={(v) =>
                  patchSlide({
                    table: {
                      headers: slide.table?.headers ?? [],
                      rows: v.split("\n").filter(Boolean).map((line) => line.split(",").map((c) => c.trim())),
                    },
                  })
                }
              />
            </>
          )}

          {slide.layout === "quote" && (
            <>
              <Area label="인용문" value={slide.quote ?? ""} onChange={(v) => patchSlide({ quote: v })} />
              <Field label="출처·발언자" value={slide.quoteAttribution ?? ""} onChange={(v) => patchSlide({ quoteAttribution: v })} />
            </>
          )}

          {slide.layout === "profile" && (
            <>
              <Field label="이름" value={slide.profile?.name ?? ""} onChange={(v) => patchSlide({ profile: { name: v, role: slide.profile?.role ?? "", detail: slide.profile?.detail ?? "" } })} />
              <Field label="직함" value={slide.profile?.role ?? ""} onChange={(v) => patchSlide({ profile: { name: slide.profile?.name ?? "", role: v, detail: slide.profile?.detail ?? "" } })} />
              <Area label="소개" value={slide.profile?.detail ?? ""} onChange={(v) => patchSlide({ profile: { name: slide.profile?.name ?? "", role: slide.profile?.role ?? "", detail: v } })} />
            </>
          )}

          {slide.sources && slide.sources.length > 0 && (
            <p className="rounded bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700">인용 출처: {slide.sources.join(", ")}</p>
          )}
        </div>
      </div>

      {deck.sources.length > 0 && (
        <div className="mt-8 border-t border-zinc-200 pt-5">
          <h3 className="text-sm font-semibold text-zinc-900">조사 출처</h3>
          <ul className="mt-2 space-y-1.5">
            {deck.sources.map((s) => (
              <li key={s.id} className="text-xs text-zinc-600">
                <span className="mr-1 font-mono text-blue-600">[{s.id}]</span>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
                <span className="text-zinc-400"> · {s.publisher}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-900 focus:outline-none"
      />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      <textarea
        value={value}
        rows={5}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm leading-relaxed focus:border-zinc-900 focus:outline-none"
      />
    </label>
  );
}
