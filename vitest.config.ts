import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/engine/vitest.config.ts",
      "packages/renderer/vitest.config.ts",
      "packages/app/vitest.config.ts",
      "scripts/vitest.config.ts",
    ],
    passWithNoTests: true,
  },
});
