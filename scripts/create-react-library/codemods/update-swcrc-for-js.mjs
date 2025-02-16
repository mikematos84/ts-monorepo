export default function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Update the "syntax" value from "ecmascript" to "typescript"
  root.find(j.Property, { key: { name: "syntax" } }).forEach((path) => {
    if (path.node.value.value === "ecmascript") {
      path.node.value.value = "typescript";
    }
  });

  // Update the "jsx" key to "tsx" and set it to true
  root.find(j.Property, { key: { name: "jsx" } }).forEach((path) => {
    path.node.key.name = "tsx"; // Change the key name to "tsx"
  });

  return root.toSource();
}
