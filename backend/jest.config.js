module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // CI-friendly configuration
  testTimeout: 30000, // 30 seconds timeout for each test
  setupTimeout: 60000, // 60 seconds for setup
  maxWorkers: process.env.CI ? 1 : '50%', // Use single worker in CI to avoid memory issues
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,
  // Coverage settings
  collectCoverage: process.env.CI === 'true',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage'
}; 