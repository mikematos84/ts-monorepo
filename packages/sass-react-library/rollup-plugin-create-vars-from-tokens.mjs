import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import TokenTransformer from './src/utils/token-transformer.mjs';

/**
 * A Rollup plugin that generates SASS and CSS variables from design tokens.
 *
 * @returns {Object} Rollup plugin configuration.
 */

function createVarsFromTokens() {
  return {
    name: 'rollup-plugin-create-vars-from-tokens',
    buildStart() {
      // Get all tokens.json files
      const filepaths = fg.sync(['src/tokens/**/tokens.json']);
      filepaths.forEach((filepath) => {
        // Load the tokens from the file
        const transformer = TokenTransformer.From(filepath);
        // Ensure the themes directory exists
        fs.ensureDirSync(path.dirname(filepath).replace('tokens', 'themes'));
        // Create the SASS variables file
        const sass = transformer.toSassVariables();
        fs.writeFileSync(filepath.replace('tokens', 'themes').replace('tokens.json', '_tokens.scss'), sass, 'utf-8');
        // Create the CSS variables file
        const css = transformer.toCssVariables({ scope: ':root' });
        fs.writeFileSync(filepath.replace('tokens', 'themes').replace('tokens.json', '_tokens.css'), css, 'utf-8');
      });
    },
  };
}

export default createVarsFromTokens;
