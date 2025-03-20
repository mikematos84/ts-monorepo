import { join } from "path";
import fs from "fs";

export default function configureWebpackForSwc(config) {
  // Read the .swcrc file
  const swcrc = JSON.parse(
    fs.readFileSync(join(__dirname, "../.swcrc"), "utf-8")
  );

  // Remove the default Babel loader
  config.module.rules = config.module.rules.filter(
    (rule) => !rule.test || !rule.test.toString().includes("tsx")
  );

  // Add SWC loader for TypeScript and JavaScript files
  config.module.rules.push({
    test: /\.(ts|tsx|js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: "swc-loader",
      options: {
        ...swcrc,
      },
    },
  });

  // Add support for .ts, .tsx, .js, and .jsx file extensions
  config.resolve.extensions.push(".ts", ".tsx", ".js", ".jsx");

  return config;
}
