import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginStorybook from "eslint-plugin-storybook";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { settings: { react: { version: "detect" } } },
  { files: ["src/**/*.{js,mjs,cjs,jsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    ...pluginReact.configs.flat.recommended,
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
  pluginStorybook.configs.recommended
];
