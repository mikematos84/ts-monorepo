export default async () => {
  return {
    moduleNameMapper: {
      "\\.(css|jpg|png|gif)$": "<rootDir>/.jest/empty-loader.mjs",
      "\\.svg$": "<rootDir>/.jest/svgr-mock.mjs",
    },
    preset: "jest",
    testEnvironment: "jsdom",
    setupFiles: ["<rootDir>/.jest/register-context.mjs"],
    setupFilesAfterEnv: ["<rootDir>/.jest/setup-jest.mjs"],
    testPathIgnorePatterns: [
      "<rootDir>/node_modules",
      "<rootDir>/dist",
      "<rootDir>/build",
      "<rootDir>/.yalc",
      "<rootDir>/.jest",
    ],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
    testMatch: ["<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx|mjs)"],
    transform: {
      "^.+\\.[tj]sx?$": ["@swc/jest"],
      "^.+\\.mjs$": ["@swc/jest"],
    },
  };
};
