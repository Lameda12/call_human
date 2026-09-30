import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Footer, Header } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "checkout | call_human()",
  robots: { index: false },
};

function paymentLink(): string | null {
  const raw = process.env.STRIPE_PAYMENT_LINK?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function Buy() {
  // Read the env var per request so it never gets baked into a prerendered page.
  await connection();
  const link = paymentLink();
  if (link) redirect(link);

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-4 px-4 py-16 font-mono sm:px-6">
        <p className="text-muted">
          <span className="text-fg">&gt;</span> checkout.open()
        </p>
        <p className="pl-4 text-red-400">! checkout opens soon. check back in a bit.</p>
        <Link href="/" className="pt-4 text-accent hover:underline">
          ← back
        </Link>
      </main>
      <Footer />
    </>
  );
}
