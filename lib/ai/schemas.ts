import { z } from "zod";

// Length caps are enforced client-side by the SDK (the API ignores maxLength/maxItems).
// They double as guardrail layer 2: a full solution doesn't fit in 600 characters of prose.

export const PlanSchema = z.object({
  title: z.string().min(1).max(60),
  steps: z
    .array(
      z.object({
        task: z.string().min(1).max(140),
        success_criteria: z.string().min(1).max(400),
      }),
    )
    .min(3)
    .max(7),
});

const LineRange = z.object({ from_line: z.number().int(), to_line: z.number().int() });

export const GradeSchema = z.object({
  status: z.enum(["pass", "retry"]),
  feedback: z.string().min(1).max(600),
  highlight: z.array(LineRange).max(3),
  concept: z.string().max(40),
});

export const HintSchema = z.object({
  feedback: z.string().min(1).max(600),
  highlight: z.array(LineRange).max(3),
  concept: z.string().max(40),
});

export type Plan = z.infer<typeof PlanSchema>;
export type Grade = z.infer<typeof GradeSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type LineRangeT = z.infer<typeof LineRange>;

/** Model line numbers are 1-based and sometimes out of range; clamp and drop nonsense. */
export function clampHighlights(ranges: LineRangeT[], lineCount: number): LineRangeT[] {
  if (lineCount < 1) return [];
  return ranges
    .map(({ from_line, to_line }) => {
      const a = Math.min(Math.max(1, Math.min(from_line, to_line)), lineCount);
      const b = Math.min(Math.max(1, Math.max(from_line, to_line)), lineCount);
      return { from_line: a, to_line: b };
    })
    .slice(0, 3);
}
