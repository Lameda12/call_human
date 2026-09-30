import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "you're in | call_human()",
  robots: { index: false },
};

export default function Paid() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6">
        <div className="border border-line bg-panel px-4 py-4 font-mono text-[13px] leading-6 sm:text-sm">
          <p className="text-muted">
            <span className="text-fg">&gt;</span> payment.status
          </p>
          <p className="pl-4">
            <span className="text-accent">✓</span> paid
          </p>
          <p className="text-muted">
            <span className="text-fg">&gt;</span> users.add(role=
            <span className="text-fg">&quot;founder&quot;</span>)
          </p>
          <p className="pl-4">
            <span className="text-accent">✓</span> ok
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
            you&apos;re a founder. thank you.<span className="cursor" aria-hidden />
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            the app opens this week. we&apos;ll email a claim link to the address you used at
            checkout. from then on, it&apos;s your turn to write the code.
          </p>
        </div>
        <Link href="/" className="font-mono text-accent hover:underline">
          ← back home
        </Link>
      </main>
      <Footer />
    </>
  );
}
