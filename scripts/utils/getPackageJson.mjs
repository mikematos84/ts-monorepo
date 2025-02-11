import fs from "fs/promises";
import path from "path";

const __dirname = path.resolve(path.dirname(""));

export async function getPackageJson(dir = __dirname) {
  const data = await fs.readFile(path.join(dir, "package.json"), {
    encoding: "utf-8",
  });
  return JSON.parse(data);
}
