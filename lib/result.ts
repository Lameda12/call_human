export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export type AppError =
  | { kind: "ai_timeout" } // Claude didn't answer in time
  | { kind: "ai_unavailable"; status?: number } // 429 / 5xx / connection / auth
  | { kind: "ai_refusal"; category?: string | null } // safety decline, even after fallback
  | { kind: "ai_malformed" } // output didn't match the schema twice
  | { kind: "limit" } // free sessions used up
  | { kind: "not_found" }
  | { kind: "internal"; message: string };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
