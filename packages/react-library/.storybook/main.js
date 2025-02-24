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
  stories: ["../src/**/*.stories.@(js|jsx|mjs|mdx)"],
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
};

export default config;
