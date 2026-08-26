import { promises as fs } from "fs";
import path from "path";
import { GeneratedDeck } from "./types";

// Local filesystem storage for the MVP (dev-only: works with `npm run dev`, not Vercel's
// read-only/ephemeral filesystem). Swap this module for Supabase Storage + Postgres in Phase 2
// without touching callers — they only see saveDeck/getDeckMeta/getDeckFile/listDecks.
const STORAGE_ROOT = path.join(process.cwd(), "storage");

function deckDir(id: string): string {
  return path.join(STORAGE_ROOT, id);
}

export async function saveDeck(deck: GeneratedDeck, pptxBuffer: Buffer): Promise<void> {
  const dir = deckDir(deck.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "meta.json"), JSON.stringify(deck, null, 2), "utf-8");
  await fs.writeFile(path.join(dir, deck.fileName), pptxBuffer);
}

export async function getDeckMeta(id: string): Promise<GeneratedDeck | null> {
  try {
    const raw = await fs.readFile(path.join(deckDir(id), "meta.json"), "utf-8");
    return JSON.parse(raw) as GeneratedDeck;
  } catch {
    return null;
  }
}

export async function getDeckFile(id: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  const meta = await getDeckMeta(id);
  if (!meta) return null;
  try {
    const buffer = await fs.readFile(path.join(deckDir(id), meta.fileName));
    return { buffer, fileName: meta.fileName };
  } catch {
    return null;
  }
}

export async function listDecks(): Promise<GeneratedDeck[]> {
  try {
    const ids = await fs.readdir(STORAGE_ROOT);
    const decks = await Promise.all(ids.map((id) => getDeckMeta(id)));
    return decks
      .filter((d): d is GeneratedDeck => d !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}
