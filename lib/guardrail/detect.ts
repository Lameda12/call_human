// Layer 3 of the no-code guardrail (PLAN.md section 6).
// Pure function: given model prose and what the user already wrote, decide whether
// the prose hands the user code they did not write. Fails closed.

import type { Parser } from "@lezer/common";
import { parser as cParser } from "@lezer/cpp";
import { parser as javaParser } from "@lezer/java";
import { parser as jsParser } from "@lezer/javascript";
import { parser as pythonParser } from "@lezer/python";

export type Language = "python" | "java" | "js" | "c";

export type Detector =
  | "fence" // ``` or ~~~ block
  | "indented_block" // 4-space / tab indented line that isn't a list item
  | "code_line" // a line that looks like code and isn't copied from the user
  | "unknown_span" // `backticked` text the user never wrote
  | "unknown_call"; // name( or name[ the user never wrote

export type Finding = { detector: Detector; reason: string; snippet: string };

export type DetectInput = {
  text: string;
  language: Language;
  /** Text the tutor may quote: the user's code and the problem statement. */
  sources: string[];
};

export type DetectResult = { ok: true } | { ok: false; findings: Finding[] };

const PARSERS: Record<Language, Parser> = {
  python: pythonParser,
  js: jsParser,
  java: javaParser,
  c: cParser,
};

// Statements are only legal inside a body in Java and C.
const wrap: Record<Language, (line: string) => string> = {
  python: (l) => l,
  js: (l) => l,
  java: (l) => `class __W { void __f() { ${l} } }`,
  c: (l) => `void __f(void) { ${l} }`,
};

// Single-word spans the tutor may backtick without the user having typed them:
// naming a construct is teaching, not writing code.
const KEYWORDS: Record<Language, ReadonlySet<string>> = {
  python: new Set(
    "if elif else for while def return class try except finally with as import from in not and or is None True False break continue pass lambda yield global".split(" "),
  ),
  js: new Set(
    "if else for while do function return class try catch finally const let var new this switch case break continue null undefined true false of in typeof async await".split(" "),
  ),
  java: new Set(
    "if else for while do return class interface public private static void int long double boolean char new this null true false try catch finally switch case break continue extends implements".split(" "),
  ),
  c: new Set(
    "if else for while do return struct int long double char void unsigned sizeof NULL break continue switch case typedef const static".split(" "),
  ),
};

// Near-certain code on a single line, regardless of language.
const STRONG_PATTERNS: [RegExp, string][] = [
  [/\bdef\s+\w+\s*\(/, "function definition"],
  [/=>/, "arrow function"],
  // Condition must hold a comparison or ; so "for (almost) every number" stays prose.
  [/\b(for|while|if|switch)\s*\([^)]*[=<>;][^)]*\)/, "C-style control statement"],
  [/;\s*$/, "line ends with ;"],
  [/\{\s*$/, "line ends with {"],
  [/\w(\+\+|--)|(\+\+|--)\w|\+=|-=|\*=|\/=|==|!=|&&|\|\|/, "code operator"],
  [/^\s*return\s+\S*[[\](){}+\-*/%<>=]/, "return statement"],
];

// Python-style block header: keyword first, colon last, and something code-shaped in between.
// "if you get stuck:" is prose; "for i in range(n):" is not.
const KEYWORD_HEADER = /^\s*(if|elif|else|for|while|def|class|try|except|with)\b.*:\s*$/;
const CODE_PUNCT = /[=()[\]{};<>]/;

// Code embedded mid-sentence: "Add for j in range(i + 1, len(nums)): under it."
// or "then set seen[n] = i". Each match must itself be copied from the user.
const INLINE_PATTERNS: [RegExp, string][] = [
  [/\b(for|while|if|elif)\b[^.?!\n]*?:(?=\s|$)/g, "inline block header"],
  [/\b[A-Za-z_][\w.]*(\[[^\]\n]*\])?\s*(\+=|-=|\*=|\/=|=)(?!=)\s*[^\s=][^,.;!?\n]*/g, "inline assignment"],
];

const FENCE = /```|~~~/;
const INDENTED = /^( {4,}|\t+)\S/;
const LIST_ITEM = /^\s*([-*•]|\d+[.)])\s/;
const BACKTICK_SPAN = /`([^`\n]+)`/g;
// name( or name[ with no space between; "loop (lines 4-6)" and "value(s)" are prose.
const CALL_TOKEN = /\b([A-Za-z_][\w.]*)([([])(?!s\))/g;

const squash = (s: string) => s.replace(/\s+/g, "");

function parsesClean(line: string, language: Language): boolean {
  if (treeIsClean(line, language)) return true;
  // Models often drop the trailing semicolon: "int *p = &arr[0]" is still a C statement.
  return (language === "c" || language === "java") && !line.endsWith(";") && treeIsClean(`${line};`, language);
}

function treeIsClean(line: string, language: Language): boolean {
  const tree = PARSERS[language].parse(wrap[language](line));
  let clean = true;
  tree.iterate({
    enter(node) {
      if (node.type.isError) {
        clean = false;
        return false;
      }
    },
  });
  return clean;
}

function strongReason(line: string): string | null {
  for (const [pattern, reason] of STRONG_PATTERNS) if (pattern.test(line)) return reason;
  if (KEYWORD_HEADER.test(line) && CODE_PUNCT.test(line)) return "block header";
  return null;
}

/** Why this line looks like code, or null if it reads as prose. */
export function codeLikeReason(line: string, language: Language): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const strong = strongReason(trimmed);
  if (strong) return strong;
  // A clean parse alone isn't enough: "Yes" parses as an expression statement.
  if (CODE_PUNCT.test(trimmed) && parsesClean(trimmed, language)) return `parses as ${language}`;
  return null;
}

export function detectCode({ text, language, sources }: DetectInput): DetectResult {
  const findings: Finding[] = [];
  const corpus = squash(sources.join("\n"));
  const quoted = (s: string) => {
    const q = squash(s);
    return q.length > 0 && corpus.includes(q);
  };

  if (FENCE.test(text)) {
    findings.push({ detector: "fence", reason: "fenced code block", snippet: text.match(FENCE)![0] });
  }

  // Backticked spans: allowed only if copied from the user/problem, a bare keyword, or a number.
  for (const [, span] of text.matchAll(BACKTICK_SPAN)) {
    const s = span.trim();
    if (quoted(s) || KEYWORDS[language].has(s) || /^\d+$/.test(s)) continue;
    findings.push({ detector: "unknown_span", reason: "backticked text the user never wrote", snippet: s });
  }

  // name( / name[ outside backticks must also come from the user.
  const withoutSpans = text.replace(BACKTICK_SPAN, " ");
  for (const [, name, bracket] of withoutSpans.matchAll(CALL_TOKEN)) {
    const token = name + bracket;
    if (quoted(token)) continue;
    findings.push({ detector: "unknown_call", reason: "call or index the user never wrote", snippet: token });
  }

  for (const line of text.split("\n")) {
    if (INDENTED.test(line) && !LIST_ITEM.test(line) && !quoted(line)) {
      findings.push({ detector: "indented_block", reason: "indented block", snippet: line.trim() });
      continue;
    }
    // Judge each line with backticked quotes of the user's own code removed,
    // so "Line 4, `for i in range(n):`, stops early." is judged as prose.
    const bare = line.replace(BACKTICK_SPAN, (m, span: string) => (quoted(span) ? "X" : m));
    const reason = codeLikeReason(bare, language);
    if (reason && !quoted(line)) {
      findings.push({ detector: "code_line", reason, snippet: line.trim() });
      continue;
    }
    for (const [pattern, inlineReason] of INLINE_PATTERNS) {
      for (const [match] of bare.matchAll(pattern)) {
        if (inlineReason === "inline block header" && !CODE_PUNCT.test(match)) continue;
        if (quoted(match)) continue;
        findings.push({ detector: "code_line", reason: inlineReason, snippet: match.trim() });
      }
    }
  }

  return findings.length === 0 ? { ok: true } : { ok: false, findings };
}

/** Run the detector over every string in a structured model response (planner tasks, feedback, ...). */
export function detectInFields(
  fields: readonly string[],
  language: Language,
  sources: string[],
): DetectResult {
  const findings = fields.flatMap((text) => {
    const r = detectCode({ text, language, sources });
    return r.ok ? [] : r.findings;
  });
  return findings.length === 0 ? { ok: true } : { ok: false, findings };
}
