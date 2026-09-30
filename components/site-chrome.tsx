import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 font-mono text-sm sm:px-6">
        <Link href="/" className="text-accent hover:underline">
          call_human()
        </Link>
        <span className="text-muted">v0.1 · founding</span>
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
