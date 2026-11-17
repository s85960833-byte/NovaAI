import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["apps/api/src/**/*.test.ts", "apps/web/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "apps/api/src/auth/client.ts",
        "apps/api/src/auth/routes.ts",
        "apps/api/src/money/ledger.ts",
        "apps/api/src/money/spend-guard.ts",
        "apps/api/src/diwan/**/*.ts",
        "apps/api/src/files/validate.ts",
        "apps/api/src/files/pdf-text.ts",
        "apps/api/src/sync/merge.ts",
      ],
      exclude: ["**/*.test.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
