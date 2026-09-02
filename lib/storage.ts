import { promises as fs } from "fs";
import path from "path";
import { GeneratedDeck } from "./types";
import { getSupabase } from "./supabase";

const BUCKET = "decks";
const TABLE = "decks";

// Storage keys must stay ASCII-only — Supabase Storage (S3-compatible) rejects object keys
// containing the Korean characters in deck.fileName ("Invalid key"). The human-readable
// Korean name lives only in the `file_name` DB column and is sent via Content-Disposition
// on download, never used as the storage path itself.
function objectPath(deck: Pick<GeneratedDeck, "id" | "fileName">): string {
  return `${deck.id}/deck.pptx`;
}

/**
 * Supabase is the deployed backend, but it needs two secrets that aren't present
 * in a fresh local checkout. Rather than making `npm run dev` unusable until the
 * user provisions a project, fall back to the local `storage/` directory — same
 * interface, no cloud dependency. Production (Vercel) always has the env vars
 * set and so always takes the Supabase path.
 */
function useSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const LOCAL_DIR = path.join(process.cwd(), "storage");

async function localWrite(deck: GeneratedDeck, pptxBuffer: Buffer): Promise<void> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, `${deck.id}.json`), JSON.stringify(deck, null, 2), "utf8");
  await fs.writeFile(path.join(LOCAL_DIR, `${deck.id}.pptx`), pptxBuffer);
}

async function localRead(id: string): Promise<GeneratedDeck | null> {
  try {
    const raw = await fs.readFile(path.join(LOCAL_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as GeneratedDeck;
  } catch {
    return null;
  }
}

async function localList(): Promise<GeneratedDeck[]> {
  try {
    const files = await fs.readdir(LOCAL_DIR);
    const decks = await Promise.all(
      files.filter((f) => f.endsWith(".json")).map((f) => localRead(f.replace(/\.json$/, "")))
    );
    return decks
      .filter((d): d is GeneratedDeck => d !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

interface DeckRow {
  id: string;
  doc_type: string;
  file_name: string;
  brief: GeneratedDeck["brief"];
  classification: GeneratedDeck["classification"];
  design: GeneratedDeck["design"];
  slides: GeneratedDeck["slides"];
  qa: GeneratedDeck["qa"];
  used_llm: boolean;
  created_at: string;
  sources: GeneratedDeck["sources"];
}

function rowToDeck(row: DeckRow): GeneratedDeck {
  return {
    id: row.id,
    brief: row.brief,
    classification: row.classification,
    design: row.design,
    slides: row.slides,
    qa: row.qa,
    usedLlm: row.used_llm,
    fileName: row.file_name,
    createdAt: row.created_at,
    sources: row.sources ?? [],
  };
}

/** Upserts, so re-rendering an edited deck replaces it in place instead of duplicating. */
export async function saveDeck(deck: GeneratedDeck, pptxBuffer: Buffer): Promise<void> {
  if (!useSupabase()) return localWrite(deck, pptxBuffer);

  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath(deck), pptxBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from(TABLE).upsert({
    id: deck.id,
    doc_type: deck.brief.docType,
    file_name: deck.fileName,
    brief: deck.brief,
    classification: deck.classification,
    design: deck.design,
    slides: deck.slides,
    qa: deck.qa,
    used_llm: deck.usedLlm,
    created_at: deck.createdAt,
    sources: deck.sources,
  });
  if (insertError) throw insertError;
}

export async function getDeckMeta(id: string): Promise<GeneratedDeck | null> {
  if (!useSupabase()) return localRead(id);

  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToDeck(data as DeckRow);
}

export async function getDeckFile(id: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  const meta = await getDeckMeta(id);
  if (!meta) return null;

  if (!useSupabase()) {
    try {
      const buffer = await fs.readFile(path.join(LOCAL_DIR, `${id}.pptx`));
      return { buffer, fileName: meta.fileName };
    } catch {
      return null;
    }
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(objectPath(meta));
  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, fileName: meta.fileName };
}

export async function listDecks(): Promise<GeneratedDeck[]> {
  if (!useSupabase()) return localList();

  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DeckRow[]).map(rowToDeck);
}
