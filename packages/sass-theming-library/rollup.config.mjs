import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import sass from "sass";

export default {
  input: "src/index.ts",
  output: [
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
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ useTsconfigDeclarationDir: true }),
    postcss({
      preprocessor: (content, id) =>
        new Promise((resolve) => {
          const result = sass.compileString(content, { filename: id });
          resolve({ code: result.css.toString() });
        }),
      modules: true,
      extensions: [".scss", ".css"],
    }),
  ],
};
