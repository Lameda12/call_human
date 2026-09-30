import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://call-human.vercel.app";

const description =
  "paste a coding problem. it hands you one step at a time and never writes the code. your exam doesn't have copilot.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "call_human()",
  description,
  openGraph: {
    title: "call_human() | the AI that makes you do it yourself.",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "call_human()",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
