import fg from 'fast-glob';

/**
 * @typedef {import('fast-glob').Options} FastGlobOptions
 */

/**
 * A Rollup plugin to watch external files matching glob patterns.
 *
 * @param {string|string[]} source - A glob pattern or an array of glob patterns to watch.
 * @param {FastGlobOptions} [options] - Optional fast-glob configuration.
 * @returns {Object} Rollup plugin configuration.
 */
function watchExternalGlobs(source, options = {}) {
  const glob = Array.isArray(source) ? source : [source];
  return {
    name: 'watch-external-globs',
    buildStart() {
      // Watch all files matching the glob
      const files = fg.sync(glob, options);
      files.forEach((file) => this.addWatchFile(file));
    },
  };
}

export default watchExternalGlobs;
