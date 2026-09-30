import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

// Secret-key client. Bypasses RLS: every write in the app goes through this.
// Never import from a client component.
export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set");

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
