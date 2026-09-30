import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

// Evals hit the real API, so they never run under `pnpm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@/": root,
      "server-only": `${root}test/server-only-stub.ts`,
    },
  },
  test: {
    include: ["evals/**/*.eval.ts"],
    testTimeout: 600_000,
  },
});
