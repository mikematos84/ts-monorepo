import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import pkg from './package.json' assert { type: 'json' };
import createVarsFromTokens from './rollup-plugin-create-vars-from-tokens.mjs';
import uprootTypes from './rollup-plugin-uproot-types-to-dist.mjs';
import watchExternalGlobs from './rollup-plugin-watch-external-globs.mjs';

const output = [
  {
    dir: 'dist/cjs',
    format: 'cjs',
    exports: 'named',
  },
  {
    dir: 'dist/esm',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
];

const external = [
  ...Object.keys(pkg?.peerDependencies || []),
  ...Object.keys(pkg?.devDependencies || []),
  /\.scss/g,
  'react/jsx-runtime',
];

const plugins = [peerDepsExternal(), resolve(), commonjs(), swc()];

/** @type {import('rollup').RollupOptions} */
export default [
  ...output.map((output) => ({
    input: 'src/index.ts',
    external,
    output,
    plugins: [
      ...plugins,
      typescript({
        tsconfig: './tsconfig.json',
        outDir: `${output.dir}/types`,
        declarationDir: `${output.dir}/types`,
        sourceMap: false,
      }),
      copy({
        targets: [
          { src: 'src/**/*.scss', dest: output.dir },
          { src: 'src/themes/**/*.{scss,css}', dest: `dist` },
        ],
        flatten: false,
        hook: 'writeBundle',
      }),
      watchExternalGlobs(['src/**/*.{scss,css}', '!src/themes/**/_tokens.*']),
      createVarsFromTokens(),
      uprootTypes({ output }),
    ],
  })),
];
