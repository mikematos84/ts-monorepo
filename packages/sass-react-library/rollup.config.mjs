import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import typescript from '@rollup/plugin-typescript';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import copy from 'rollup-plugin-copy';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import watchGlobs from 'rollup-plugin-watch-globs';
import pkg from './package.json' assert { type: 'json' };
import TokenTransformer from './src/utils/token-transformer.mjs';

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

const plugins = [
  peerDepsExternal(),
  resolve(),
  commonjs(),
  swc(),
  watchGlobs({
    globs: ['src/**/*.scss'],
  }),
];

/** @type {import('rollup').RollupOptions} */
export default [
  ...output.map((output) => ({
    input: 'src/index.ts',
    external,
    output,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        outDir: `${output.dir}/types`,
        declarationDir: `${output.dir}/types`,
        sourceMap: false,
      }),
      copy({
        targets: [
          { src: 'src/**/*.scss', dest: output.dir },
          { src: 'src/themes/**/*.scss', dest: `dist` },
        ],
        flatten: false,
        hook: 'writeBundle',
      }),
      {
        name: 'transform-tokens',
        buildStart() {
          const filepaths = fg.sync(['src/tokens/**/tokens.json']);
          filepaths.forEach((filepath) => {
            const transformer = TokenTransformer.From(filepath);

            fs.ensureDirSync(path.dirname(filepath).replace('tokens', 'themes'));

            const sass = transformer.toSassVariables();
            fs.writeFileSync(
              filepath.replace('tokens', 'themes').replace('tokens.json', '_tokens.scss'),
              sass,
              'utf-8',
            );
            const css = transformer.toCssVariables({ scope: ':root' });
            fs.writeFileSync(filepath.replace('tokens', 'themes').replace('tokens.json', '_tokens.scss'), css, 'utf-8');
          });
        },
      },
      {
        name: 'cleanup-types-from-cjs-and-move-types-from-esm-to-root',
        writeBundle() {
          const filepaths = fg.sync([`${output.dir}/**/*.d.ts{,.map}`]);

          // If files are in cjs, remove them
          if (output.format === 'cjs') {
            filepaths.forEach((filepath) => {
              fs.removeSync(filepath);
            });
          }

          // if files are in esm, move them to root
          if (output.format === 'esm') {
            filepaths.forEach((filepath) => {
              const newFile = filepath.replace('dist/esm/', 'dist/');
              fs.moveSync(filepath, newFile, { overwrite: true });
            });
          }

          // Remove types directory
          fs.removeSync(`${output.dir}/types`);
        },
      },
    ],
  })),
];
