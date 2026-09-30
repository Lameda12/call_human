import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "you're in | call_human()",
  robots: { index: false },
};

const SHARE_TEXT =
  "found an AI tutor that refuses to write your code. it hands you one step at a time and you do the rest. $5 founding access:";
const SHARE_URL = "https://call-human.vercel.app";
const tweet = `https://x.com/intent/post?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`;
const sms = `sms:?&body=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`;

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
        <div className="flex flex-col gap-3 border-t border-line pt-8">
          <p className="font-mono text-sm text-muted">
            <span className="text-fg">&gt;</span> call_human(task=
            <span className="text-fg">&quot;tell one friend who has a midterm coming&quot;</span>)
          </p>
          <div className="flex flex-wrap gap-3 font-mono text-sm">
            <a href={sms} className="border border-accent px-4 py-2 text-accent hover:bg-accent hover:text-bg">
              text a friend
            </a>
            <a
              href={tweet}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-line px-4 py-2 text-muted hover:border-fg hover:text-fg"
            >
              post on x
            </a>
          </div>
        </div>
        <Link href="/" className="font-mono text-accent hover:underline">
          ← back home
        </Link>
      </main>
      <Footer />
    </>
  );
}
