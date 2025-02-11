export function getPackageName(packageJson) {
  return packageJson.name.includes("/")
    ? packageJson.name.split("/")[1]
    : packageJson.name;
}
