"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const TASK = "write the loop that checks each pair of numbers";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const noopSubscribe = () => () => {};

// false during SSR and the hydration pass, true after. Lets the server emit the
// settled frame (for crawlers and no-JS) while the client replays the typing.
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Terminal() {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const animating = hydrated && !reduced;
  const done = !animating || typed >= TASK.length;
  const shown = animating ? TASK.slice(0, typed) : TASK;

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), 28);
    return () => window.clearTimeout(id);
  }, [typed, done]);

  useEffect(() => {
    if (!hydrated || !done) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [hydrated, done]);

  return (
    <figure
      aria-label="call_human() waiting for you to write the next step"
      data-hydrated={hydrated}
      className="terminal w-full overflow-hidden border border-line bg-panel font-mono text-[13px] leading-6 sm:text-sm"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs text-muted">
        <span>~/two_sum.py</span>
        <span>step 2 / 4</span>
      </div>
      <div className="space-y-1 px-4 py-4">
        <p className="text-muted">
          <span className="text-fg">&gt;</span> claude.solve(problem)
        </p>
        <p className="pl-4 text-muted">
          <span className="text-fg">&gt;</span> plan() <span className="text-fg">→</span> 4 steps{" "}
          <span className="text-muted/70">[hidden]</span>
        </p>
        <p className="pl-4 text-muted">
          <span className="text-accent">✓</span> call_human(step=1) <span className="text-fg">→</span> pass
        </p>
        <p className="terminal-live break-words pl-8 -indent-4">
          <span className="text-fg">&gt;</span> <span className="text-accent">call_human</span>
          <span className="text-muted">(task=</span>
          <span className="text-fg">&quot;{shown}</span>
          {!done && <span className="cursor" aria-hidden />}
          {done && <span className="text-fg">&quot;</span>}
          <span className="text-muted">)</span>
        </p>
        <p className="terminal-live pl-8 text-muted">
          {done ? (
            <>
              <span className="text-accent-dim">░</span> waiting for human... {formatElapsed(elapsed)}
              <span className="cursor" aria-hidden />
            </>
          ) : (
            <span aria-hidden>&nbsp;</span>
          )}
        </p>
      </div>
    </figure>
  );
}
