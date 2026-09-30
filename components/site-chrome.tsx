import Link from "next/link";

const NAV = [
  ["#how", "how"],
  ["#demo", "demo"],
  ["#receipt", "receipt"],
  ["#faq", "faq"],
] as const;

export function Header({ nav = false }: { nav?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 font-mono text-sm sm:px-6">
        <Link href="/" className="text-accent hover:underline">
          call_human()
        </Link>
        {nav ? (
          <nav className="flex items-center gap-4 sm:gap-6">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="hidden text-muted hover:text-fg sm:inline">
                {label}
              </a>
            ))}
            <a href="/buy" className="border border-accent px-3 py-1.5 text-accent hover:bg-accent hover:text-bg">
              $5
            </a>
          </nav>
        ) : (
          <span className="text-muted">v0.1 · founding</span>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 font-mono text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
        <span>solved by a human.</span>
        <span>© 2026 call_human()</span>
      </div>
    </footer>
  );
}
