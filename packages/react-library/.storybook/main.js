
import { join, dirname } from "path";
import fs from "fs";

const swcrc = JSON.parse(
  fs.readFileSync(join(__dirname, "../.swcrc"), "utf-8")
);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}

const config = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@chromatic-com/storybook"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
    options: {},
  },
  core: {
    builder: "webpack5",
  },
  webpackFinal: async (config) => {
    // Remove the default Babel loader
    config.module.rules = config.module.rules.filter(
      (rule) => !rule.test?.toString().includes("tsx")
    );

    // add the SWC loader
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: getAbsolutePath("swc-loader"),
        options: {
          jsc: swcrc.jsc,
        },
      },
    });

    return config;
  },
};

export default config;
