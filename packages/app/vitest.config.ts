import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "app",
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    typecheck: { enabled: true },
    setupFiles: ["src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@swoopy/engine": new URL("../engine/src/index.ts", import.meta.url)
        .pathname,
      "@swoopy/renderer": new URL("../renderer/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
