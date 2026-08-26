import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service_role key (never exposed to the browser).
 * RLS on `public.decks` and the `decks` storage bucket has no anon/authenticated policies —
 * only service_role can read/write, which is intentional: this app has no per-user auth model,
 * so access control lives entirely at the app boundary (proxy.ts access-code gate) rather than
 * in Postgres RLS. Throws if the required env vars aren't set, since every caller needs Supabase.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요.");
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
