export default function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Look for `typescript({...})` inside the `plugins` array
  root
    .find(j.CallExpression, {
      callee: { name: "typescript" },
    })
    .forEach((path) => {
      j(path).remove();
    });

  root
    .find(j.ImportDeclaration, {
      source: {
        value: "@rollup/plugin-typescript",
      },
    })
    .remove();

  // Remove rollup plugin config for dts that looks like this
  root.find(j.ObjectExpression).forEach((path) => {
    const hasDtsInput = path.value.properties.some(
      (prop) =>
        prop.key.name === "input" &&
        prop.value.value === "dist/esm/types/index.d.ts"
    );

    if (hasDtsInput) {
      j(path).remove();
    }
  });

  // Replace all occurrences of `.ts` → `.js` and `.tsx` → `.jsx`
  root
    .find(j.StringLiteral)
    .filter(
      (path) =>
        path.value.value.endsWith(".ts") || path.value.value.endsWith(".tsx")
    )
    .forEach((path) => {
      path.value.value = path.value.value
        .replace(/\.ts$/, ".js")
        .replace(/\.tsx$/, ".jsx");
    });

  // Remove typescript related module imports
  const modules = [
    "@rollup/plugin-typescript",
    "rollup-plugin-dts",
    "fs-extra",
    "fast-glob",
    "colors",
  ];

  modules.forEach((module) => {
    root
      .find(j.ImportDeclaration, {
        source: {
          value: module,
        },
      })
      .remove();
  });

  return root.toSource();
}
