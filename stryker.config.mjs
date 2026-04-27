export default {
  mutate: [
    "packages/app/src/url-encoding.ts",
  ],
  testRunner: "vitest",
  vitest: {
    dir: "packages/app",
    related: false,
  },
  coverageAnalysis: "all",
  ignorePatterns: [
    ".trunk",
  ],
  reporters: ["clear-text", "json"],
  jsonReporter: { fileName: "docs/feature/share-url-compression/deliver/mutation/stryker-report.json" },
  timeoutMS: 30000,
};
