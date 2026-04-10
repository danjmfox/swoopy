import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // dist/coverage outputs; plain JS at root; characterise scripts excluded from tsconfig
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/*.js",
      "packages/engine/src/characterise.ts",
      "packages/engine/src/characterise-relay.ts",
      "graphify-out",
    ],
  },
  tseslint.configs.recommended,
);
