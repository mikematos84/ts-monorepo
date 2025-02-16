export default function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // I want to remove webpackFinal from the storybook main.js file
  root
    .find(j.ObjectProperty, {
      key: {
        name: "webpackFinal",
      },
    })
    .remove();

  return root.toSource();
}
