module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove "preset"
  root.find(j.ObjectProperty, { key: { name: "preset" } }).remove();

  // Update moduleFileExtensions by removing ts and tsx
  root
    .find(j.ObjectProperty, { key: { name: "moduleFileExtensions" } })
    .find(j.ArrayExpression)
    .forEach((path) => {
      path.value.elements = path.value.elements.filter(
        (element) => element.value !== "ts" && element.value !== "tsx"
      );
    });

  // Update testMatch by removing ts and tsx
  root
    .find(j.ObjectProperty, { key: { name: "testMatch" } })
    .find(j.ArrayExpression)
    .forEach((path) => {
      path.value.elements = path.value.elements.map((element) => {
        element.value = element.value.replace(/\.(ts|tsx)/, ".js");
        return element;
      });
    });

  // Update transform by changing "^.+\\.[tj]sx?$" to "^.+\\.jsx?$"
  root
    .find(j.ObjectProperty, { key: { name: "transform" } })
    .find(j.ObjectExpression)

    .forEach((path) => {
      path.value.properties = path.value.properties.map((property) => {
        if (property.key.name === "^.+\\.[tj]sx?$") {
          property.key.name = "^.+\\.jsx?$";
        }
        return property;
      });
    });

  return root.toSource();
};
