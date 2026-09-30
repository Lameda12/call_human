import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

export function BuyButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="/buy"
      className={`inline-flex items-center justify-center bg-accent px-6 py-4 font-mono text-base font-semibold text-bg transition-colors hover:bg-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${className}`}
    >
      $5 founding access
    </a>
  );
}

function Section({ id, label, title, children }: { id: string; label: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{label}</p>
        <h2 className="mt-3 max-w-3xl font-mono text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

const Prompt = () => <span className="text-fg">&gt;</span>;

// ---------------------------------------------------------------------------
// how it works
// ---------------------------------------------------------------------------

const STEPS = [
  {
    call: "paste(problem)",
    title: "paste the problem",
    body: "your assignment, a leetcode, last year's midterm. python, java, javascript or c.",
  },
  {
    call: "plan() → hidden",
    title: "it plans, you don't see the plan",
    body: "claude breaks it into 3 to 7 steps and keeps them to itself. you only ever see the next one.",
  },
  {
    call: 'call_human(task="…")',
    title: "it calls you",
    body: "each step is a function call where you're the function. you write the code. it waits.",
  },
  {
    call: "grade() → line 3",
    title: "it points, it never writes",
    body: "wrong? it tells you which line and what to think about. hints go concept → location → plain english. never code.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how" label="how it works" title="the AI is the orchestrator. you're the tool it calls.">
      <ol className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.call} className="flex flex-col gap-3 bg-bg p-6">
            <p className="font-mono text-sm text-muted">
              <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> <Prompt /> {s.call}
            </p>
            <h3 className="font-mono text-lg font-semibold">{s.title}</h3>
            <p className="leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// example session
// ---------------------------------------------------------------------------

const CODE = [
  "def total_of(nums):",
  "    for n in nums:",
  "        total = 0",
  "        total += n",
  "    return total",
];
const HIGHLIGHT = 3;

export function ExampleSession() {
  return (
    <Section id="demo" label="example session" title="it tells you where you're wrong. it won't tell you what to type.">
      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="overflow-hidden border border-line bg-panel font-mono text-[13px] leading-6 sm:text-sm">
          <figcaption className="flex justify-between border-b border-line px-4 py-2 text-xs text-muted">
            <span>~/total.py · your code</span>
            <span>step 2 / 3</span>
          </figcaption>
          <pre className="overflow-x-auto py-3">
            {CODE.map((line, i) => {
              const n = i + 1;
              const hit = n === HIGHLIGHT;
              return (
                <div key={n} className={`flex px-4 ${hit ? "bg-red-500/10" : ""}`}>
                  <span className={`w-6 shrink-0 select-none text-right ${hit ? "text-red-400" : "text-muted/60"}`}>{n}</span>
                  <code className={`pl-4 ${hit ? "text-fg" : "text-muted"}`}>{line || " "}</code>
                </div>
              );
            })}
          </pre>
        </figure>

        <div className="border border-line bg-panel px-4 py-4 font-mono text-[13px] leading-6 sm:text-sm">
          <p className="text-muted">
            <Prompt /> call_human(task=<span className="text-fg">&quot;add up every number in the list&quot;</span>)
          </p>
          <p className="pl-4 text-muted">&lt; returned 5 lines</p>
          <p className="text-muted">
            <Prompt /> grade(step=2)
          </p>
          <p className="pl-4 text-red-400">↺ retry · line 3</p>
          <p className="mt-3 border-l-2 border-accent pl-3 font-sans text-base leading-relaxed text-fg">
            close. <code className="font-mono text-accent">total = 0</code> sits inside the loop, so it resets on every
            pass. where should it live so it survives?
          </p>
          <p className="mt-5 text-muted">
            <Prompt /> hint(level=3)
          </p>
          <p className="mt-2 border-l-2 border-line pl-3 font-sans text-base leading-relaxed text-muted">
            1. start a running total before you look at any number. 2. add each number to it. 3. give it back once
            every number is counted.
          </p>
          <p className="mt-5 text-xs text-muted">
            quotes only your own code. points at line numbers. every response is scanned for code you didn&apos;t write,
            and thrown out if it has any.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// versus
// ---------------------------------------------------------------------------

const ROWS: [string, string, string][] = [
  ["the no-answer rule", "a prompt asking the model to hold back. a clever message can talk it out of it.", "enforced on the server. every reply is checked, and anything with code you didn't write is thrown out."],
  ["the plan", "shows you the whole approach up front.", "hidden. you get one step at a time."],
  ["when you're wrong", "rewrites your line \"for clarity\".", "points at the line number and asks the question."],
  ["proof you did it", "none.", "a receipt with every step, your paste count, and a keystroke replay."],
];

export function Versus() {
  return (
    <Section id="vs" label="why not just use a chatbot" title="every AI tutor can be talked into writing your code. this one can't.">
      <div className="overflow-hidden border border-line">
        <div className="hidden grid-cols-[1fr_1.4fr_1.4fr] border-b border-line bg-panel font-mono text-xs uppercase tracking-wider text-muted sm:grid">
          <span className="px-4 py-3" />
          <span className="px-4 py-3">general AI chatbots</span>
          <span className="px-4 py-3 text-accent">call_human()</span>
        </div>
        {ROWS.map(([what, them, us]) => (
          <div key={what} className="grid gap-2 border-b border-line px-4 py-5 last:border-b-0 sm:grid-cols-[1fr_1.4fr_1.4fr] sm:gap-0 sm:px-0 sm:py-0">
            <p className="font-mono text-sm font-semibold sm:px-4 sm:py-5">{what}</p>
            <p className="text-muted sm:px-4 sm:py-5">
              <span className="font-mono text-xs uppercase text-muted/70 sm:hidden">chatbots: </span>
              {them}
            </p>
            <p className="text-fg sm:border-l sm:border-line sm:px-4 sm:py-5">
              <span className="font-mono text-xs uppercase text-accent sm:hidden">call_human(): </span>
              {us}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// receipt
// ---------------------------------------------------------------------------

// Positions (0-100) on the replay track. Accent = step boundaries.
const STEP_TICKS = [18, 44, 71];

export function Receipt() {
  return (
    <Section id="receipt" label="the receipt" title="finish a problem, get proof a human solved it.">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4 text-lg leading-relaxed text-muted">
          <p>
            every keystroke is recorded while you work. when you finish, you get a public receipt: time taken, steps,
            hints used, how many times you pasted, and a replay anyone can scrub through.
          </p>
          <p>
            send it to a TA, pin it on your github, drop it in the group chat before the midterm.{" "}
            <span className="text-fg">it&apos;s the one thing an AI can&apos;t fake for you.</span>
          </p>
          <p className="font-mono text-xs">you choose whether the replay is public. stats-only is one click.</p>
        </div>

        <figure className="border border-line bg-panel p-5 font-mono sm:p-6" aria-label="example receipt">
          <figcaption className="flex items-center justify-between text-xs text-muted">
            <span>receipt · example</span>
            <span>call_human()</span>
          </figcaption>
          <p className="mt-5 text-2xl font-semibold">two sum</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            {[
              ["time", "23:41"],
              ["steps", "4 / 4"],
              ["hints", "2"],
              ["pasted", "0 times"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className={k === "pasted" ? "text-accent" : "text-fg"}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <div className="relative h-2 bg-line" role="img" aria-label="replay timeline with three step markers and no pastes">
              <div className="absolute inset-y-0 left-0 w-[62%] bg-accent-dim" />
              {STEP_TICKS.map((x) => (
                <span key={x} className="absolute -top-1 h-4 w-px bg-accent" style={{ left: `${x}%` }} />
              ))}
              <span className="absolute -top-1.5 h-5 w-1.5 bg-fg" style={{ left: "62%" }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>▶ replay 4x</span>
              <span>14:40 / 23:41</span>
            </div>
          </div>
          <p className="mt-6 border-t border-line pt-4 text-sm text-accent">solved by a human.</p>
        </figure>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// founding offer
// ---------------------------------------------------------------------------

export function Founding() {
  return (
    <Section id="founding" label="founding access" title="$5, once. that's it.">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <ul className="flex flex-col gap-4 font-mono text-sm">
          {[
            "unlimited sessions when the app opens this week",
            "every language: python, java, javascript, c",
            "public receipts with keystroke replay",
            "one payment, no subscription",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="text-accent">✓</span>
              <span>{item}</span>
            </li>
          ))}
          <li className="flex gap-3 text-muted">
            <span>·</span>
            <span>free tier: 3 sessions a day, for everyone, forever</span>
          </li>
        </ul>
        <div className="flex flex-col items-start gap-3 border border-line bg-panel p-6">
          <p className="font-mono text-4xl font-semibold">$5</p>
          <p className="text-muted">one-time founding price. tax added at checkout where it applies.</p>
          <BuyButton className="mt-3 w-full" />
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// faq
// ---------------------------------------------------------------------------

const FAQ: [string, ReactNode][] = [
  [
    "will it ever show me code?",
    "no. every reply is scanned before you see it. if it contains code you didn't write, it's thrown away and the tutor has to try again in plain english. it can quote your own code back to you, and that's it.",
  ],
  [
    "isn't an AI tutor just a nicer way to cheat?",
    "most are. this one is built the other way around: it can't write your code, and the receipt shows exactly how much you typed versus pasted.",
  ],
  ["does it run my code?", "no. it reads it the way a TA would and tells you what's off. run it yourself."],
  ["which languages?", "python, java, javascript and c."],
  [
    "what if i paste something in?",
    "you can. pastes over 40 characters are logged and counted on your receipt. nothing is hidden from you or from whoever reads it.",
  ],
  [
    "what do i get for $5?",
    "unlimited sessions once the app opens this week, for a single payment. the free tier stays at 3 sessions a day.",
  ],
  ["who's building this?", "a CS student at Dalhousie in Halifax, in public, this week."],
];

export function Faq() {
  return (
    <Section id="faq" label="faq" title="questions">
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-mono text-base marker:hidden">
              <span>{q}</span>
              <span className="text-accent transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// closing
// ---------------------------------------------------------------------------

export function Closing() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-sm text-muted">
          <Prompt /> call_human(task=<span className="text-fg">&quot;get good before the midterm&quot;</span>)
        </p>
        <h2 className="max-w-3xl font-mono text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
          your exam doesn&apos;t have copilot. practice like it.
          <span className="cursor" aria-hidden />
        </h2>
        <BuyButton />
      </div>
    </section>
  );
}
