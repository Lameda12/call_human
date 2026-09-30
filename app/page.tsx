import { Footer, Header } from "@/components/site-chrome";
import {
  BuyButton,
  Closing,
  ExampleSession,
  Faq,
  Founding,
  HowItWorks,
  Receipt,
  Versus,
} from "@/components/landing/sections";
import { Terminal } from "@/components/terminal";

export default function Home() {
  return (
    <>
      <Header nav />
      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">ai tutor · no code output</p>
            <h1 className="font-mono text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">
              the AI that makes you do it yourself.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              paste a coding problem. it hands you one step at a time and never writes the code.{" "}
              <span className="text-fg">your exam doesn&apos;t have copilot.</span>
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-5">
              <BuyButton />
              <a href="#how" className="font-mono text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
                see how it works ↓
              </a>
            </div>
            <p className="font-mono text-xs text-muted">one-time. no subscription. opens this week.</p>
          </div>
          <Terminal />
        </section>

        <HowItWorks />
        <ExampleSession />
        <Versus />
        <Receipt />
        <Founding />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
