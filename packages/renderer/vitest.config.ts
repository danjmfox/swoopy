import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "renderer",
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    typecheck: { enabled: true },
  },
  resolve: {
    alias: {
      "@swoopy/engine": new URL("../engine/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
