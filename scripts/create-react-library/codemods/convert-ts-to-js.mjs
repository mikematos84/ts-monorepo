export default function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove TypeScript type annotations
  root.find(j.TSTypeAnnotation).remove();

  // Remove interface declarations
  root.find(j.TSInterfaceDeclaration).remove();

  // Remove type alias declarations
  root.find(j.TSTypeAliasDeclaration).remove();

  // Remove import type statements
  root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.importKind === "type")
    .remove();

  // Change any import statemts that reference .ts or .tsx file to .js and .jsx respectively
  root.find(j.ImportDeclaration).forEach((path) => {
    const source = path.node.source.value;
    if (source.endsWith(".ts")) {
      path.node.source.value = source.replace(/\.ts$/, ".js");
    } else if (source.endsWith(".tsx")) {
      path.node.source.value = source.replace(/\.tsx$/, ".jsx");
    }
  });

  return root.toSource();
}
