import fg from 'fast-glob';
import fs from 'fs-extra';

/**
 * @typedef {Object} OutputConfig
 * @property {string} dir - The directory where output files are stored.
 * @property {string} format - The module format ('cjs' or 'esm').
 * @property {string} [file] - An optional file path.
 */

/**
 * A Rollup plugin to manage TypeScript declaration files.
 *
 * @param {{ output: OutputConfig }} options - Plugin options.
 * @returns {Object} Rollup plugin configuration.
 */
function uprootTypes({ output }) {
  return {
    name: 'rollup-plugin-uproot-types',
    writeBundle() {
      // Get all d.ts and d.ts.map files
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
      const typesPaths = fg.sync([`${output.dir}/**/types`], { onlyDirectories: true });
      typesPaths.forEach((typesPath) => {
        fs.removeSync(typesPath);
      });
    },
  };
}

export default uprootTypes;
