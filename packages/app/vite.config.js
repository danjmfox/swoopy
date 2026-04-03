import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@swoopy/engine": new URL("../engine/src/index.ts", import.meta.url)
        .pathname,
      "@swoopy/renderer": new URL("../renderer/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
//# sourceMappingURL=vite.config.js.map
