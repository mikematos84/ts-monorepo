import fg from 'fast-glob';
import fs from 'fs-extra';

class TokenTransformer {
  private tokens: Record<string, any> = {};
  private vars: Array<[string, any]> = [];

  constructor(source: Record<string, any> | string) {
    if (typeof source === 'object') {
      this.tokens = source || {};
    }

    if (typeof source === 'string') {
      this.tokens = fs.readJsonSync(source);
    }
  }

  static From(source: Record<string, any> | string) {
    return new TokenTransformer(source);
  }

  private replaceReferences(tokens: Record<string, any>) {
    const replace = (obj: Record<string, any>) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          replace(obj[key]);
        } else {
          if (obj[key].match(/{{.*}}/)) {
            const reference = obj[key].replace(/{{|}}/g, '');
            const referenceParts = reference.split('.');
            let resolvedValue = tokens;
            for (const part of referenceParts) {
              resolvedValue = resolvedValue?.[part];
              if (resolvedValue === undefined) {
                throw new Error(`Reference "${reference}" not found in tokens.`);
              }
            }
            obj[key] = resolvedValue;
          }
        }
      }
    };

    replace(tokens);

    return tokens;
  }

  private recurseTokens(obj: Record<string, any>, prefix = '') {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        this.recurseTokens(obj[key], `${prefix}${key}-`);
      } else {
        this.vars.push([prefix + key, obj[key]]);
      }
    }
  }

  From(tokens: Record<string, any>) {
    this.tokens = tokens || {};
    this.vars = [];
  }

  toCssVariables({ scope = ':root' }: { scope?: string } = {}) {
    if (this.vars.length > 0) this.vars = [];
    this.tokens = this.replaceReferences(this.tokens);
    this.recurseTokens(this.tokens, '--');
    let content = this.vars
      .map(([key, value]) => {
        return `${scope ? '\t' : ''}${key}: ${value};`;
      })
      .join('\n');
    return scope ? `${scope} {\n${content}\n}` : content;
  }

  toSassVariables({ scope }: { scope?: string } = {}) {
    if (this.vars.length > 0) this.vars = [];
    this.tokens = this.replaceReferences(this.tokens);
    this.recurseTokens(this.tokens, '$');
    let content = this.vars
      .map(([key, value]) => {
        return `${scope ? '\t' : ''}${key}: ${value};`;
      })
      .join('\n');
    return scope ? `${scope} {\n${content}\n}` : content;
  }
}

export async function generateThemes() {
  const filepaths = await fg.sync('src/tokens/**/tokens.json', { cwd: process.cwd() });
  for (const filepath of filepaths) {
    const transformer = TokenTransformer.From(filepath);
    const css = transformer.toCssVariables();
    const sass = transformer.toSassVariables();
    fs.outputFileSync(`${filepath.replace('tokens', 'themes').replace('tokens.json', '_tokens.css')}`, css);
    fs.outputFileSync(`${filepath.replace('tokens', 'themes').replace('tokens.json', '_tokens.scss')}`, sass);
  }
}

export default TokenTransformer;

if (require.main === module) {
  generateThemes();
}
