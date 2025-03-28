import fs from 'fs-extra';

class TokenTransformer {
  #tokens = {};
  #vars = [];

  constructor(source) {
    if (typeof source === 'object') {
      this.#tokens = source || {};
    }

    if (typeof source === 'string') {
      this.#tokens = fs.readJsonSync(source);
    }
  }

  static From(source) {
    return new TokenTransformer(source);
  }

  #replaceReferences(tokens) {
    const replace = (obj) => {
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

  #recurseTokens(obj, prefix = '') {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        this.#recurseTokens(obj[key], `${prefix}${key}-`);
      } else {
        this.#vars.push([prefix + key, obj[key]]);
      }
    }
  }

  toCssVariables({ scope = ':root' } = {}) {
    if (this.#vars.length > 0) this.#vars = [];
    this.#tokens = this.#replaceReferences(this.#tokens);
    this.#recurseTokens(this.#tokens, '--');
    let content = this.#vars
      .map(([key, value]) => {
        return `${scope ? '\t' : ''}${key}: ${value};`;
      })
      .join('\n');
    return scope ? `${scope} {\n${content}\n}` : content;
  }

  toSassVariables({ scope } = {}) {
    if (this.#vars.length > 0) this.#vars = [];
    this.#tokens = this.#replaceReferences(this.#tokens);
    this.#recurseTokens(this.#tokens, '$');
    let content = this.#vars
      .map(([key, value]) => {
        return `${scope ? '\t' : ''}${key}: ${value};`;
      })
      .join('\n');
    return scope ? `${scope} {\n${content}\n}` : content;
  }
}

export default TokenTransformer;
