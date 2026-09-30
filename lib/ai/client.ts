import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5-5";

// Server-side refusal fallback: on a safety decline the API re-runs the request on
// Anthropic's recommended fallback model inside the same call.
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | undefined;

export function getClient(): Anthropic {
  // maxRetries covers 408/409/429/5xx and connection errors with backoff.
  client ??= new Anthropic({ maxRetries: 2, timeout: 45_000 });
  return client;
}
