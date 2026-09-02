import Link from "next/link";
import { getDeckMeta } from "@/lib/storage";
import { DeckEditor } from "./DeckEditor";

// Reads the saved deck on every request — never prerendered, since decks are
// created at runtime and edited in place.
export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getDeckMeta(id);

  if (!deck) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-zinc-900">문서를 찾을 수 없어요</h1>
        <p className="mt-2 text-sm text-zinc-500">삭제되었거나 주소가 잘못됐을 수 있어요.</p>
        <Link href="/new" className="mt-6 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white">
          새로 만들기
        </Link>
      </div>
    );
  }

  return <DeckEditor initialDeck={deck} />;
}
