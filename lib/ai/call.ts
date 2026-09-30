import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { DetectResult } from "@/lib/guardrail/detect";
import { err, ok, type AppError, type Result } from "@/lib/result";
import { FALLBACK_BETA, MODEL, getClient } from "./client";
import { TUTOR_SYSTEM, leakReminder } from "./prompts";

export type Effort = "low" | "medium";

export type Block = { text: string; cache?: boolean };

export type StructuredRequest = {
  blocks: Block[];
  /** Mid-conversation system message sent after the user turn (guardrail retry). */
  reminder?: string;
  effort: Effort;
  schema: z.ZodType;
};

export type RawResponse = {
  stop_reason: string | null;
  stop_details?: { category?: string | null } | null;
  parsed_output?: unknown;
  usage: { input_tokens: number; output_tokens: number };
};

export type Transport = (req: StructuredRequest) => Promise<RawResponse>;

export type LeakRecord = { attemptNo: number; detector: string; reason: string; rawResponse: string };

export type Usage = { inputTokens: number; outputTokens: number; latencyMs: number; calls: number };

export type StructuredOutcome<T> = {
  value: T;
  /** false when both attempts leaked; the caller must replace user-visible text. */
  guardPassed: boolean;
  leaks: LeakRecord[];
  usage: Usage;
};

export const anthropicTransport: Transport = async ({ blocks, reminder, effort, schema }) => {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system: [{ type: "text", text: TUTOR_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: blocks.map((b) => ({
          type: "text" as const,
          text: b.text,
          ...(b.cache ? { cache_control: { type: "ephemeral" as const } } : {}),
        })),
      },
      ...(reminder ? [{ role: "system" as const, content: reminder }] : []),
    ],
  });
  return response;
};

function mapApiError(e: unknown): AppError | null {
  if (e instanceof Anthropic.APIConnectionTimeoutError) return { kind: "ai_timeout" };
  if (e instanceof Anthropic.APIError) return { kind: "ai_unavailable", status: e.status };
  return null;
}

/**
 * One structured model call with the failure handling from PLAN.md sections 6 and 10:
 * - API errors: the SDK already retried, so map and return.
 * - Refusal (after the server-side fallback): return ai_refusal.
 * - Output that doesn't match the schema: retry once, then ai_malformed.
 * - Guardrail rejection: log, retry once with a reminder, then hand back with guardPassed=false.
 */
export async function callStructured<T>(opts: {
  blocks: Block[];
  schema: z.ZodType<T>;
  effort: Effort;
  guard: (value: T) => DetectResult;
  transport?: Transport;
}): Promise<Result<StructuredOutcome<T>>> {
  const transport = opts.transport ?? anthropicTransport;
  const usage: Usage = { inputTokens: 0, outputTokens: 0, latencyMs: 0, calls: 0 };
  const leaks: LeakRecord[] = [];
  let reminder: string | undefined;
  let malformedRetried = false;
  let leakRetried = false;

  // At most 3 calls: first try, one malformed retry, one guardrail retry.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now();
    let raw: RawResponse;
    try {
      raw = await transport({ blocks: opts.blocks, reminder, effort: opts.effort, schema: opts.schema });
    } catch (e) {
      usage.latencyMs += Date.now() - started;
      const apiError = mapApiError(e);
      if (apiError) return err(apiError);
      // Anything that isn't an API error is the SDK failing to parse or validate the output.
      console.warn("[ai] structured output failed to parse:", e);
      raw = { stop_reason: "malformed", usage: { input_tokens: 0, output_tokens: 0 } };
    }
    usage.latencyMs += Date.now() - started;
    usage.calls += 1;
    usage.inputTokens += raw.usage.input_tokens;
    usage.outputTokens += raw.usage.output_tokens;

    if (raw.stop_reason === "refusal") {
      return err({ kind: "ai_refusal", category: raw.stop_details?.category ?? null });
    }

    const parsed = raw.stop_reason === "malformed" ? null : opts.schema.safeParse(raw.parsed_output);
    if (!parsed?.success) {
      if (malformedRetried) return err({ kind: "ai_malformed" });
      malformedRetried = true;
      continue;
    }

    const verdict = opts.guard(parsed.data);
    if (verdict.ok) return ok({ value: parsed.data, guardPassed: true, leaks, usage });

    const rawResponse = JSON.stringify(parsed.data);
    for (const f of verdict.findings) {
      leaks.push({ attemptNo: attempt, detector: f.detector, reason: `${f.reason}: ${f.snippet}`, rawResponse });
    }
    if (leakRetried) return ok({ value: parsed.data, guardPassed: false, leaks, usage });
    leakRetried = true;
    reminder = leakReminder(verdict.findings.map((f) => `${f.reason}: "${f.snippet}"`));
  }

  return err({ kind: "ai_malformed" });
}
