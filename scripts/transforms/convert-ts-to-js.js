module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove all import declarations that are only used for type imports
  root.find(j.ImportDeclaration, { importKind: "type" }).remove();

  // Remove type annotations from variable declarations
  root.find(j.VariableDeclaration).forEach((path) => {
    path.node.declarations.forEach((declaration) => {
      if (
        declaration.id.type === "Identifier" &&
        declaration.id.typeAnnotation
      ) {
        declaration.id.typeAnnotation = null;
      }
    });
  });

  // Remove type annotations from function parameters and arrow functions
  root.find(j.FunctionDeclaration).forEach((path) => {
    path.node.params.forEach((param) => {
      if (param.type === "Identifier" && param.typeAnnotation) {
        param.typeAnnotation = null;
      }
    });

    if (path.node.returnType) {
      path.node.returnType = null;
    }
  });

  // Remove TypeScript imports
  root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === "@storybook/react")
    .remove();

  // Remove `satisfies` keyword while keeping the object/expression
  root.find(j.VariableDeclarator).forEach((path) => {
    const { init } = path.node;

    if (init && init.type === "TSAsExpression") {
      path.node.init = init.expression; // Remove type assertion
    } else if (init && init.type === "TSSatisfiesExpression") {
      path.node.init = init.expression; // Remove satisfies syntax
    }
  });

  root.find(j.ExportNamedDeclaration).forEach((path) => {
    const { declaration } = path.node;

    if (declaration && declaration.type === "VariableDeclaration") {
      declaration.declarations.forEach((declarator) => {
        const { init } = declarator;

        if (init && init.type === "TSAsExpression") {
          declarator.init = init.expression;
        } else if (init && init.type === "TSSatisfiesExpression") {
          declarator.init = init.expression;
        }
      });
    }
  });

  // Remove TypeScript type aliases (e.g., `type Story = StoryObj<typeof meta>;`)
  root.find(j.TSTypeAliasDeclaration).remove();

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
