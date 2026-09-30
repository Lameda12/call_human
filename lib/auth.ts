import "server-only";
import { createClient } from "@/lib/supabase/server";

// Returns the current user's id, signing in anonymously on first use.
// Call from Server Actions or Route Handlers only (it may write auth cookies).
// Lazy on purpose: crawlers and landing-page visitors never create auth users.
export async function getOrCreateUserId(): Promise<string> {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const sub = claims?.claims?.sub;
  if (sub) return sub;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`anonymous sign-in failed: ${error?.message ?? "no user returned"}`);
  }
  return data.user.id;
}
