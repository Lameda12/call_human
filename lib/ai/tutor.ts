import { detectCode, detectInFields, type Language } from "@/lib/guardrail/detect";
import { ok, type Result } from "@/lib/result";
import { callStructured, type StructuredOutcome, type Transport } from "./call";
import {
  gradeInstructions,
  hintInstructions,
  numberedCode,
  PLAN_INSTRUCTIONS,
  problemBlock,
} from "./prompts";
import { clampHighlights, GradeSchema, HintSchema, PlanSchema, type Grade, type Hint, type Plan } from "./schemas";

export type StepInput = { idx: number; task: string; success_criteria: string };

const lineCount = (code: string) => (code.length === 0 ? 0 : code.split("\n").length);

// ---------------------------------------------------------------------------
// plan
// ---------------------------------------------------------------------------

export async function generatePlan(
  args: { problem: string; language: Language },
  transport?: Transport,
): Promise<Result<StructuredOutcome<Plan>>> {
  const sources = [args.problem];
  const result = await callStructured({
    blocks: [{ text: problemBlock(args.problem, args.language), cache: true }, { text: PLAN_INSTRUCTIONS }],
    schema: PlanSchema,
    effort: "medium",
    // success_criteria never reaches the browser, so only visible text is checked.
    guard: (p) => detectInFields([p.title, ...p.steps.map((s) => s.task)], args.language, sources),
    transport,
  });
  if (!result.ok || result.value.guardPassed) return result;

  // Both attempts leaked: keep the plan's structure, replace any visible text that leaks.
  const clean = (text: string) => detectCode({ text, language: args.language, sources }).ok;
  const plan = result.value.value;
  return ok({
    ...result.value,
    value: {
      title: clean(plan.title) ? plan.title : "untitled problem",
      steps: plan.steps.map((s, i) => ({
        ...s,
        task: clean(s.task) ? s.task : `build part ${i + 1} of the solution`,
      })),
    },
  });
}

// ---------------------------------------------------------------------------
// grade
// ---------------------------------------------------------------------------

export function gradeFallback(stepNumber: number, highlight: Grade["highlight"]): string {
  const where = highlight[0] ? ` Compare it to lines ${highlight[0].from_line}-${highlight[0].to_line}.` : "";
  return `Look at step ${stepNumber} again and re-read the task.${where}`;
}

export async function gradeStep(
  args: {
    problem: string;
    language: Language;
    code: string;
    step: StepInput;
    totalSteps: number;
    previousFeedback: string | null;
  },
  transport?: Transport,
): Promise<Result<StructuredOutcome<Grade>>> {
  const stepNumber = args.step.idx + 1;
  const result = await callStructured({
    blocks: [
      { text: problemBlock(args.problem, args.language), cache: true },
      {
        text: gradeInstructions({
          stepNumber,
          totalSteps: args.totalSteps,
          task: args.step.task,
          successCriteria: args.step.success_criteria,
          previousFeedback: args.previousFeedback,
        }),
      },
      { text: numberedCode(args.code) },
    ],
    schema: GradeSchema,
    effort: "low",
    guard: (g) => detectInFields([g.feedback, g.concept], args.language, [args.code, args.problem]),
    transport,
  });
  if (!result.ok) return result;

  const grade = result.value.value;
  const highlight = clampHighlights(grade.highlight, lineCount(args.code));
  // The pass/retry decision isn't the leak; only the visible text gets replaced.
  const value: Grade = result.value.guardPassed
    ? { ...grade, highlight }
    : { ...grade, highlight, feedback: gradeFallback(stepNumber, highlight), concept: "" };
  return ok({ ...result.value, value });
}

// ---------------------------------------------------------------------------
// hint
// ---------------------------------------------------------------------------

export const HINT_FALLBACK: Record<1 | 2 | 3, string> = {
  1: "Re-read the task for this step. What is the one thing it asks your code to do?",
  2: "Walk through your code line by line with a tiny example and write down what each variable holds.",
  3: "Say the steps out loud in plain words first: what goes in, what you do to each piece, and what comes out.",
};

export async function getHint(
  args: {
    problem: string;
    language: Language;
    code: string;
    step: StepInput;
    level: 1 | 2 | 3;
  },
  transport?: Transport,
): Promise<Result<StructuredOutcome<Hint>>> {
  const result = await callStructured({
    blocks: [
      { text: problemBlock(args.problem, args.language), cache: true },
      {
        text: hintInstructions({
          stepNumber: args.step.idx + 1,
          task: args.step.task,
          successCriteria: args.step.success_criteria,
          level: args.level,
        }),
      },
      { text: numberedCode(args.code) },
    ],
    schema: HintSchema,
    effort: "low",
    guard: (h) => detectInFields([h.feedback, h.concept], args.language, [args.code, args.problem]),
    transport,
  });
  if (!result.ok) return result;

  const hint = result.value.value;
  const highlight = clampHighlights(hint.highlight, lineCount(args.code));
  const value: Hint = result.value.guardPassed
    ? { ...hint, highlight }
    : { feedback: HINT_FALLBACK[args.level], highlight, concept: "" };
  return ok({ ...result.value, value });
}
