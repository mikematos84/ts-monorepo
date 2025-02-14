module.exports = async () => {
  return {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/.config/setup-jest.js"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  }
};