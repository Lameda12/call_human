import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { RawResponse, StructuredRequest, Transport } from "./call";
import { generatePlan, getHint, gradeStep, HINT_FALLBACK } from "./tutor";

const PROBLEM = "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.";
const CODE = "def two_sum(nums, target):\n    for i in range(len(nums)):\n        total = 0\n    return None";
const STEP = { idx: 1, task: "write the loop that checks each pair of numbers", success_criteria: "Nested loops over index pairs i<j." };

const usage = { input_tokens: 100, output_tokens: 20 };
const reply = (parsed_output: unknown, stop_reason = "end_turn"): RawResponse => ({ stop_reason, parsed_output, usage });

/** Replays scripted responses and records every request. */
function scripted(...responses: (RawResponse | Error)[]) {
  const calls: StructuredRequest[] = [];
  const transport: Transport = async (req) => {
    calls.push(req);
    const next = responses.shift();
    if (!next) throw new Error("transport called more times than scripted");
    if (next instanceof Error) throw next;
    return next;
  };
  return { transport, calls };
}

const cleanGrade = { status: "retry", feedback: "Your loop on line 2 only looks at one number at a time.", highlight: [{ from_line: 2, to_line: 2 }], concept: "nested loops" };
const leakyGrade = { ...cleanGrade, feedback: "Add for j in range(i + 1, len(nums)): under it." };

describe("gradeStep", () => {
  it("returns clean feedback in one call", async () => {
    const { transport, calls } = scripted(reply(cleanGrade));
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r.ok && r.value.value.feedback).toBe(cleanGrade.feedback);
    expect(r.ok && r.value.leaks).toEqual([]);
    expect(calls).toHaveLength(1);
    expect(calls[0].effort).toBe("low");
    expect(calls[0].reminder).toBeUndefined();
  });

  it("retries once with a reminder after a leak, and logs the leak", async () => {
    const { transport, calls } = scripted(reply(leakyGrade), reply(cleanGrade));
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.guardPassed).toBe(true);
    expect(r.value.value.feedback).toBe(cleanGrade.feedback);
    expect(r.value.leaks.length).toBeGreaterThan(0);
    expect(r.value.leaks[0].attemptNo).toBe(1);
    expect(calls).toHaveLength(2);
    expect(calls[1].reminder).toMatch(/rejected/);
  });

  it("falls back to generic feedback after two leaks but keeps the status", async () => {
    const { transport } = scripted(reply(leakyGrade), reply({ ...leakyGrade, status: "pass" }));
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.guardPassed).toBe(false);
    expect(r.value.value.status).toBe("pass");
    expect(r.value.value.feedback).toBe("Look at step 2 again and re-read the task. Compare it to lines 2-2.");
    expect(r.value.leaks.map((l) => l.attemptNo)).toContain(2);
  });

  it("clamps highlight ranges to the code", async () => {
    const { transport } = scripted(reply({ ...cleanGrade, highlight: [{ from_line: 9, to_line: 0 }] }));
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r.ok && r.value.value.highlight).toEqual([{ from_line: 1, to_line: 4 }]);
  });

  it("retries once on malformed output, then gives up", async () => {
    const { transport, calls } = scripted(reply({ nope: true }), reply({ status: "maybe" }));
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r).toEqual({ ok: false, error: { kind: "ai_malformed" } });
    expect(calls).toHaveLength(2);
  });

  it("recovers when the retry after malformed output is valid", async () => {
    const { transport } = scripted(new SyntaxError("Unexpected token"), reply(cleanGrade));
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r.ok).toBe(true);
  });

  it("maps a refusal", async () => {
    const { transport } = scripted({ stop_reason: "refusal", stop_details: { category: "cyber" }, usage });
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r).toEqual({ ok: false, error: { kind: "ai_refusal", category: "cyber" } });
  });

  it("maps a timeout", async () => {
    const { transport } = scripted(new Anthropic.APIConnectionTimeoutError());
    const r = await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: null }, transport);
    expect(r).toEqual({ ok: false, error: { kind: "ai_timeout" } });
  });

  it("puts the problem first (cached) and the code last", async () => {
    const { transport, calls } = scripted(reply(cleanGrade));
    await gradeStep({ problem: PROBLEM, language: "python", code: CODE, step: STEP, totalSteps: 4, previousFeedback: "earlier note" }, transport);
    const blocks = calls[0].blocks;
    expect(blocks[0].cache).toBe(true);
    expect(blocks[0].text).toContain("<problem");
    expect(blocks.at(-1)!.text).toContain("<student_code>");
    expect(blocks.at(-1)!.text).toContain("2 |     for i in range(len(nums)):");
    expect(blocks[1].text).toContain("earlier note");
  });
});

describe("generatePlan", () => {
  const plan = {
    title: "two sum",
    steps: [
      { task: "write a function that takes the list and the target", success_criteria: "Function signature with two params." },
      { task: "write the loop that checks each pair of numbers", success_criteria: "Nested loops." },
      { task: "return the two positions when a pair adds up", success_criteria: "Returns [i, j]." },
    ],
  };

  it("returns a clean plan", async () => {
    const { transport, calls } = scripted(reply(plan));
    const r = await generatePlan({ problem: PROBLEM, language: "python" }, transport);
    expect(r.ok && r.value.value).toEqual(plan);
    expect(calls[0].effort).toBe("medium");
  });

  it("does not guard success_criteria, which the student never sees", async () => {
    const withCodeCriteria = { ...plan, steps: plan.steps.map((s) => ({ ...s, success_criteria: "for i in range(len(nums)): ..." })) };
    const { transport, calls } = scripted(reply(withCodeCriteria));
    const r = await generatePlan({ problem: PROBLEM, language: "python" }, transport);
    expect(r.ok && r.value.guardPassed).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it("replaces only the leaking task after two leaks", async () => {
    const leaky = { ...plan, steps: [plan.steps[0], { ...plan.steps[1], task: "write for i in range(len(nums)):" }, plan.steps[2]] };
    const { transport } = scripted(reply(leaky), reply(leaky));
    const r = await generatePlan({ problem: PROBLEM, language: "python" }, transport);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.guardPassed).toBe(false);
    expect(r.value.value.steps.map((s) => s.task)).toEqual([plan.steps[0].task, "build part 2 of the solution", plan.steps[2].task]);
  });

  it("rejects plans outside 3-7 steps as malformed", async () => {
    const { transport } = scripted(reply({ ...plan, steps: plan.steps.slice(0, 2) }), reply({ ...plan, steps: plan.steps.slice(0, 1) }));
    const r = await generatePlan({ problem: PROBLEM, language: "python" }, transport);
    expect(r).toEqual({ ok: false, error: { kind: "ai_malformed" } });
  });
});

describe("getHint", () => {
  it("returns the hint", async () => {
    const hint = { feedback: "What do you need to remember about numbers you've already seen?", highlight: [], concept: "lookup" };
    const { transport } = scripted(reply(hint));
    const r = await getHint({ problem: PROBLEM, language: "python", code: CODE, step: STEP, level: 1 }, transport);
    expect(r.ok && r.value.value).toEqual(hint);
  });

  it("uses the level's generic hint after two leaks", async () => {
    const leaky = { feedback: "Use seen = {} and check seen.get(target - n).", highlight: [], concept: "hash map" };
    const { transport } = scripted(reply(leaky), reply(leaky));
    const r = await getHint({ problem: PROBLEM, language: "python", code: CODE, step: STEP, level: 3 }, transport);
    expect(r.ok && r.value.value.feedback).toBe(HINT_FALLBACK[3]);
  });
});
