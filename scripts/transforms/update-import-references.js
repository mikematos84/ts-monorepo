module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Update import references
  root.find(j.ImportDeclaration).forEach((path) => {
    const source = path.node.source.value;

    if (typeof source === "string") {
      const updatedSource = source
        .replace(/\.tsx?$/, (ext) => (ext === ".tsx" ? ".jsx" : ".js"))
        .replace(/\/index\.(js|jsx)$/, "");

      if (updatedSource !== source) {
        path.node.source.value = updatedSource;
      }
    }
  });

  // Update export references
  root.find(j.ExportNamedDeclaration).forEach((path) => {
    if (path.node.source) {
      const source = path.node.source.value;

      if (typeof source === "string") {
        const updatedSource = source
          .replace(/\.tsx?$/, (ext) => (ext === ".tsx" ? ".jsx" : ".js"))
          .replace(/\/index\.(js|jsx)$/, "");

        if (updatedSource !== source) {
          path.node.source.value = updatedSource;
        }
      }
    }
  });

  return root.toSource();
};
