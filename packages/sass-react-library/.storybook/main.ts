import type { StorybookConfig } from "@storybook/react-webpack5";
import { join, dirname } from "path";
import configureWebpackForSass from "./configureWebpackForSass";
import configureWebpackForSwc from "./configureWebpackForSwc";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-styling-webpack"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
    options: {},
  },
  core: {
    builder: "webpack5",
  },
  webpackFinal: async (config) => {
    // Configure SCSS
    configureWebpackForSass(config);

    // Configure SWC
    configureWebpackForSwc(config);

    return config;
  },
};

export default config;
