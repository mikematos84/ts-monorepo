module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Update the stories to just be js, jsx, mjs, and mdx files
  root
    .find(j.ObjectProperty)
    .filter((path) => path.node.key.name === "stories")
    .forEach((path) => {
      path.node.value.elements[0] = j.stringLiteral(
        "../src/**/*.stories.@(js|jsx|mjs|mdx)"
      );
    });

  // Find the webpackFinal function
  root
    .find(j.ObjectProperty)
    .filter((path) => path.node.key.name === "webpackFinal")
    .forEach((path) => {
      const functionBody = path.node.value.body.body;

      // Remove filter rule for tsx files
      path.node.value.body.body = functionBody.filter((node) => {
        if (node.type === "ExpressionStatement") {
          const expression = node.expression;
          if (expression.type === "AssignmentExpression") {
            return false;
          }
        }
        return true;
      });

      // Update the regex to exclude ts and tsx
      const rule = functionBody.find(
        (node) =>
          node.type === "ExpressionStatement" &&
          node.expression.type === "CallExpression" &&
          node.expression.callee.property.name === "push"
      );
      if (rule) {
        const testProperty = rule.expression.arguments[0].properties.find(
          (prop) => prop.key.name === "test"
        );
        if (testProperty) {
          // Update the regex to exclude ts and tsx
          testProperty.value = j.literal(/\.(js|jsx|mjs)$/);
        }
      }
    });

  return root.toSource();
};
