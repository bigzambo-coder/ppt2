import Link from "next/link";
import { listDecks } from "@/lib/storage";

const DOC_TYPE_LABEL: Record<string, string> = {
  proposal: "제안서",
  presentation: "발표 PPT",
  intro: "소개서",
};

export default async function ProjectsPage() {
  const decks = await listDecks();

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 홈으로
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">지난 프로젝트</h1>
        <Link href="/new" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white">
          새로 만들기
        </Link>
      </div>

      {decks.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">아직 만든 문서가 없어요.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {decks.map((deck) => (
            <li key={deck.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
              <div>
                <p className="font-medium text-zinc-900">{deck.fileName}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {DOC_TYPE_LABEL[deck.brief.docType]} · {deck.classification.label} ·{" "}
                  {new Date(deck.createdAt).toLocaleString("ko-KR")}
                </p>
              </div>
              <a
                href={`/api/download/${deck.id}`}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                다운로드
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
