// Define a function to validate the package name

export function validatePackageName(value) {
  return /^[@?\/?a-z0-9-]{1,214}$/.test(value) ? true : "Invalid package name";
}
