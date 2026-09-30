import { Footer, Header } from "@/components/site-chrome";
import { Terminal } from "@/components/terminal";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <section className="flex flex-col gap-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            ai tutor · no code output
          </p>
          <h1 className="font-mono text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            the AI that makes you do it yourself.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            paste a coding problem. it hands you one step at a time and never writes the code.{" "}
            <span className="text-fg">your exam doesn&apos;t have copilot.</span>
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-5">
            <a
              href="/buy"
              className="inline-flex items-center justify-center bg-accent px-6 py-4 font-mono text-base font-semibold text-bg transition-colors hover:bg-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              $5 founding access
            </a>
            <span className="font-mono text-xs text-muted">one-time. no subscription.</span>
          </div>
        </section>
        <Terminal />
      </main>
      <Footer />
    </>
  );
}
