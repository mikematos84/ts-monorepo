export function getPackageScope(packageJson) {
  return packageJson.name.includes("/") ? packageJson.name.split("/")[0] : null;
}
