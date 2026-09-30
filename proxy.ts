import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that read the session. The landing page, /buy and receipts stay untouched.
  matcher: ["/app/:path*", "/s/:path*", "/paid", "/claim"],
};
