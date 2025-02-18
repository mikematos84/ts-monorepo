module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove the import statement for `typescript-eslint`
  root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === "typescript-eslint")
    .remove();

  // Target and remove spread elements referencing `tseslint.configs.recommended`
  root.find(j.SpreadElement).forEach((path) => {
    const { argument } = path.node;

    // Check for a two-level MemberExpression like `tseslint.configs.recommended`
    if (
      argument.type === "MemberExpression" &&
      argument.object.type === "MemberExpression" &&
      argument.object.object.name === "tseslint" &&
      argument.object.property.name === "configs" &&
      argument.property.name === "recommended"
    ) {
      // Remove this spread element
      j(path).remove();
    }
  });

  return root.toSource();
};
