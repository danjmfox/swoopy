export default {
  mutate: ["src/url-encoding.ts"],
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
    related: false,
  },
  coverageAnalysis: "perTest",
  ignorePatterns: [".trunk"],
  reporters: ["clear-text", "json"],
  jsonReporter: {
    fileName: "../../docs/feature/pbt-url-encoding/deliver/mutation/stryker-report.json",
  },
  timeoutMS: 60000,
};
