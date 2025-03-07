module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root.find(j.ObjectExpression).forEach((path) => {
    const properties = path.node.properties;

    // Remove "preset" property
    path.node.properties = properties.filter(
      (prop) => prop.key.name !== "preset"
    );

    properties.forEach((prop) => {
      if (!prop.key || !prop.value) return;

      // Update moduleFileExtensions (remove "ts" and "tsx")
      if (prop.key.name === "moduleFileExtensions" && prop.value.elements) {
        prop.value.elements = prop.value.elements.filter(
          (el) => el.value !== "ts" && el.value !== "tsx"
        );
      }

      // Update testMatch (remove "ts" and "tsx" from glob pattern)
      if (prop.key.name === "testMatch" && prop.value.elements) {
        prop.value.elements = prop.value.elements.map((el) => {
          if (el.value.includes("(ts|tsx|js|jsx|mjs)")) {
            el.value = el.value.replace("(ts|tsx|js|jsx|mjs)", "(js|jsx|mjs)");
          }
          return el;
        });
      }

      // Update transform key "^.+\\.[tj]sx?$" -> "^.+\\.jsx?$"
      if (
        prop.key.name === "transform" &&
        prop.value.type === "ObjectExpression"
      ) {
        prop.value.properties.forEach((transformProp) => {
          if (transformProp.key.value === "^.+\\.[tj]sx?$") {
            transformProp.key.value = "^.+\\.jsx?$";
          }
        });
      }
    });
  });

  return root.toSource();
};
