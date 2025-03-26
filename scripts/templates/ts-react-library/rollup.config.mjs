import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import swc from '@rollup/plugin-swc';
import pkg from './package.json' assert { type: 'json' };
import watchGlobs from 'rollup-plugin-watch-globs';
import copy from 'rollup-plugin-copy';
import fg from 'fast-glob';
import fs from 'fs-extra';

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
  // postcss({
  //   extract: true,
  //   minimize: true,
  //   sourceMap: true,
  // }),
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
        name: 'cleanup-types-from-cjs-and-move-types-from-esm-to-root',
        writeBundle() {
          const files = fg.sync([`${output.dir}/**/*.d.ts{,.map}`]);

          // If files are in cjs, remove them
          if (output.format === 'cjs') {
            files.forEach((file) => {
              fs.removeSync(file);
            });
          }

          // if files are in esm, move them to root
          if (output.format === 'esm') {
            files.forEach((file) => {
              const newFile = file.replace('dist/esm/', 'dist/');
              fs.moveSync(file, newFile);
            });
          }

          // Remove types directory
          fs.removeSync(`${output.dir}/types`);
        },
      },
    ],
  })),
];
