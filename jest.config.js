/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "<rootDir>/jest.setup.ts",
  globalTeardown: "<rootDir>/jest.teardown.ts",
  transform: {
    ".(ts|tsx)": [
      "ts-jest",
      {
        compiler: "ttypescript"
      }
    ]
  },
  collectCoverage: true,
  collectCoverageFrom: ["./src/**", "!**/shared/tests/**", "!**/*.json", "!./src/scripts/**"],
  coverageThreshold: {
    // global: {
    //   branches: 100,
    //   functions: 100,
    //   lines: 100,
    //   statements: 100
    // }
    // SAD FACE :((((((
  }
};
