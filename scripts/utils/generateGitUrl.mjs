import { getPackageName } from "../utils/getPackageName.mjs";
import { getPackageScope } from "../utils/getPackageScope.mjs";

export function generateGitUrl(packageJson, relativePath = null) {
  const user = getPackageScope(packageJson)?.replace("@", "");
  const name = getPackageName(packageJson);
  const base = "git+https://github.com";
  return [
    base,
    ...(user ? [user] : []),
    ...(name ? [name] : []),
    ...(relativePath ? [relativePath] : []),
  ].join("/");
}
