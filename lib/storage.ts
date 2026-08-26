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
  };
}

export async function saveDeck(deck: GeneratedDeck, pptxBuffer: Buffer): Promise<void> {
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath(deck), pptxBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from(TABLE).insert({
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
  });
  if (insertError) throw insertError;
}

export async function getDeckMeta(id: string): Promise<GeneratedDeck | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToDeck(data as DeckRow);
}

export async function getDeckFile(id: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  const meta = await getDeckMeta(id);
  if (!meta) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).download(objectPath(meta));
  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, fileName: meta.fileName };
}

export async function listDecks(): Promise<GeneratedDeck[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DeckRow[]).map(rowToDeck);
}
