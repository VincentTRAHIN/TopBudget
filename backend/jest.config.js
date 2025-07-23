module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
  maxWorkers: process.env.CI ? 1 : "50%",
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverage: process.env.CI === "true",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tests/**",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
};
