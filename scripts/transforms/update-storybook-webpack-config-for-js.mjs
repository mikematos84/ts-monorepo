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

  // find the webpackFinal Function
  root
    .find(j.ObjectProperty)
    .filter((path) => path.node.key.name === "webpackFinal")
    .forEach((path) => {
      // Remove filter rule for tsx files
      path.node.value.body.body = path.node.value.body.body.filter((node) => {
        if (node.type === "ExpressionStatement") {
          const expression = node.expression;
          if (expression.type === "AssignmentExpression") {
            return false;
          }
        }
        return true;
      });

      // Update the config.module.rules.push rule for swc-loader to only test for js|jsx|mjs files
      path.node.value.body.body.forEach((node) => {
        if (node.type === "ExpressionStatement") {
          const expression = node.expression;
          if (expression.type === "CallExpression") {
            const args = expression.arguments;
            if (args.length === 1) {
              const arg = args[0];
              if (arg.type === "ObjectExpression") {
                const properties = arg.properties;
                properties.forEach((property) => {
                  if (property.type === "ObjectProperty") {
                    if (property.key.name === "test") {
                      property.value = j.stringLiteral("\\.(js|jsx|mjs)$");
                    }
                  }
                });
              }
            }
          }
        }
      });
    });

  return root.toSource();
};
