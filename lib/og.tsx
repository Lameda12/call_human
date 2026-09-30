import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT =
  'call_human(): the AI that makes you do it yourself. A terminal line reads call_human(task="write the loop that checks for duplicates"), waiting for human...';

const BG = "#0b0b0c";
const PANEL = "#111113";
const LINE = "#222226";
const FG = "#e8e6e3";
const MUTED = "#8b8b90";
const ACCENT = "#39ff88";
const ACCENT_DIM = "#1d7a45";

const fontsDir = join(process.cwd(), "assets/fonts");

export async function renderOgImage() {
  const [regular, semibold] = await Promise.all([
    readFile(join(fontsDir, "GeistMono-Regular.ttf")),
    readFile(join(fontsDir, "GeistMono-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: FG,
          fontFamily: "Geist Mono",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: ACCENT, fontSize: 36, fontWeight: 600 }}>call_human()</span>
          <span style={{ color: MUTED, fontSize: 24 }}>ai tutor · no code output</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: 1000,
          }}
        >
          the AI that makes you do it yourself.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: PANEL,
            border: `2px solid ${LINE}`,
            padding: "28px 32px",
            fontSize: 25,
          }}
        >
          <div style={{ display: "flex", whiteSpace: "pre" }}>
            <span style={{ color: FG }}>{"> "}</span>
            <span style={{ color: ACCENT }}>call_human</span>
            <span style={{ color: MUTED }}>(task=</span>
            <span style={{ color: FG }}>&quot;write the loop that checks for duplicates&quot;</span>
            <span style={{ color: MUTED }}>)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", whiteSpace: "pre", color: MUTED }}>
            <span style={{ color: ACCENT_DIM }}>{"  ░ "}</span>
            <span>waiting for human...</span>
            <span style={{ width: 15, height: 27, marginLeft: 6, background: ACCENT }} />
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist Mono", data: regular, style: "normal", weight: 400 },
        { name: "Geist Mono", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}
