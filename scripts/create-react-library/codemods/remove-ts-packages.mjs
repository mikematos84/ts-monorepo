export default function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // List of packages to remove
  const packagesToRemove = [
    "ts-jest",
    "typescript",
    "typescript-eslint",
    "@types/jest",
    "@types/react",
    "@types/react-dom",
    "@rollup/plugin-typescript",
    "rollup-plugin-dts",
  ];

  // Find dependencies and devDependencies and remove specified packages
  root
    .find(j.Property)
    .filter(
      (path) =>
        path.node.key.name === "dependencies" ||
        path.node.key.name === "devDependencies"
    )
    .forEach((path) => {
      console.info(path);
      const dependencies = path.node.value.properties;
      // Filter out the packages that need to be removed
      path.node.value.properties = dependencies.filter(
        (dep) => !packagesToRemove.includes(dep.key.value)
      );
    });

  // Return the modified JSON source
  return root.toSource();
}
