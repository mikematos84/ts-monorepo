export default async () => {
  return {
    moduleNameMapper: {
      "\\.(css|jpg|png|gif)$": "<rootDir>/.jest/empty-loader.mjs",
      "\\.svg$": "<rootDir>/.jest/svgr-mock.mjs",
    },

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

    moduleFileExtensions: ["js", "jsx", "json", "node", "mjs"],
    testMatch: ["<rootDir>/src/**/*.(test|spec).(js|jsx|mjs)"],

    transform: {
      "^.+\\.jsx?$": ["@swc/jest"],
      "^.+\\.mjs$": ["@swc/jest"],
    }
  };
};
