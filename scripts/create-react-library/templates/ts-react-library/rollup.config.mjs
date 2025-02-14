import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import swc from "@rollup/plugin-swc";
import pkg from "./package.json" assert { type: "json" };
import dts from "rollup-plugin-dts";
import fs from "fs-extra";
import fg from "fast-glob";
import colors from "colors";

const external = [...Object.keys(pkg?.peerDependencies || [])];

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
    input: "src/index.ts",
    external,
    output,
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: output.dir,
        declarationDir: `${output.dir}/types`,
        sourceMap: false,
      }),
      swc(),
    ],
  })),
  {
    input: "dist/esm/types/index.d.ts",
    output: { file: "dist/index.d.ts", format: "esm" },
    plugins: [
      dts(),
      {
        name: "cleanup-dts-files",
        generateBundle() {
          const files = fg.sync(["dist/{cjs,esm}/**/*.d.ts"]);
          console.info(colors.green("Cleaning up d.ts files"));
          files.forEach((file) => fs.removeSync(file));

          const dirs = fg.sync(["dist/{cjs,esm}"], { onlyDirectories: true });
          console.info(colors.green("Cleaning up types directory"));
          dirs.forEach((dir) => fs.removeSync(`${dir}/types`));
        },
      },
    ],
  },
];
