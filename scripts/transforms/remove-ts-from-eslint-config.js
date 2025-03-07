module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove the tseslint import
  root
    .find(j.ImportDeclaration, {
      source: { value: "typescript-eslint" },
    })
    .remove();

  // Remove ...tseslint.configs.recommended
  root
    .find(j.SpreadElement, {
      argument: {
        object: {
          object: {
            name: "tseslint",
          },
          property: {
            name: "configs",
          },
        },
        property: {
          name: "recommended",
        },
      },
    })
    .remove();

  // Update files to remove typescript extensions
  root
    .find(j.ExportDefaultDeclaration)
    .find(j.ArrayExpression)
    .find(j.ObjectExpression, {
      properties: [
        {
          key: {
            name: "files",
          },
        },
      ],
    })
    .find(j.ArrayExpression)
    .find(j.Literal, {
      value: "src/**/*.{js,mjs,cjs,ts,jsx,tsx}",
    })
    .replaceWith(j.literal("src/**/*.{js,mjs,cjs,jsx}"));

  return root.toSource();
};
