import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import swc from "@rollup/plugin-swc";
import pkg from "./package.json" with { type: "json" };
import fs from "fs-extra";
import path from "path";
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import postcss from "rollup-plugin-postcss";

// load the SWC configuration
const swcConfig = await fs.readJSON(path.resolve(".swcrc"));

const external = [
  ...Object.keys(pkg?.peerDependencies || []), 
  ...Object.keys(pkg?.devDependencies || [])
];

const output = [
  {
    dir: "dist/cjs",
    format: "cjs",
    exports: "named",
  },
  {
    dir: "dist/esm",
    format: "esm",
    preserveModules: true,
  },
];

/** @type {import('rollup').RollupOptions} */
export default [
  ...output.map((output) => ({
    input: "src/index.js",
    external,
    output,
    plugins: [
      peerDepsExternal(),
      resolve({ extensions: [".js", ".jsx"] }),
      commonjs(),
      postcss({
        extract: true,
        modules: true,
        inject: true,
      }),
      vanillaExtractPlugin({}),
      swc({
        swc: {
          jsc: swcConfig.jsc
        }
      }),
    ],
  })),
];
