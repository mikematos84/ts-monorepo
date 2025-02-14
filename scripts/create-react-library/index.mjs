import prompts from "prompts";
import { program } from "commander";
import path from "path";
import { spawn, spawnSync } from "child_process";
import colors from "colors";
import fs from "fs-extra";
import fg from "fast-glob";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { ChildProcess } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = path.join(__dirname, "../../");
const SCRIPT_PATH = __dirname;
const TEMPLATES_PATH = path.join(SCRIPT_PATH, "templates");

let PACKAGE_PATH = null;

// Define command-line options
program
  .option("-n, --package-name <string>", "What is the name of the package?")
  .option("-t, --typescript [boolean]", "Do you want to use TypeScript?");

program.parse(process.argv);

const inputs = program.opts();

// Define prompts
const questions = [];
// if a package name is not provided, ask for it
if (!inputs.packageName) {
  questions.push({
    type: "text",
    name: "packageName",
    message: "What is the name of the package?",
    validate: (value) => {
      if (!value.match(/^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/)) {
        return "Package name must be all lowercase and contain only letters, numbers, and dashes. Scoped packages must start with @ followed by the scope name.";
      }
      return true;
    },
    initial: "my-package",
  });
}

// if typescript is not provided, ask for it
if (!inputs.typescript) {
  questions.push({
    type: "confirm",
    name: "typescript",
    message: "Do you want to use TypeScript?",
    initial: true,
  });
}

const response = await prompts(questions);

// Merge the command-line options with the prompt responses
const options = { ...inputs, ...response };
const [scope, packageName] = options.packageName.includes("/")
  ? options.packageName.split("/")
  : [null, options.packageName];

PACKAGE_PATH = path.join(ROOT_PATH, "packages", packageName);
const packagePath = path.join(ROOT_PATH, "packages", packageName);

async function cleanupTemplateFolder() {
  console.info(colors.yellow("Template folder cleaned up."));
  const files = await fg.sync(
    ["node_modules", "dist", "build", "out", "storybook-static", "coverage"],
    {
      cwd: path.join(TEMPLATES_PATH, "ts-react-library"),
      absolute: true,
      onlyDirectories: true,
    }
  );
  for (const file of files) {
    await fs.remove(file);
  }
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updatePackageNameReferences() {
  console.info(colors.blue(`Package ${packageName} created successfully.`));
  process.stdout.write(colors.yellow("Updating package name references..."));
  const files = await fg.sync(`**/*`, { cwd: PACKAGE_PATH, absolute: true });

  for (const file of files) {
    let content = await fs.readFile(file, "utf8");
    content = content.replace(/ts-react-library/g, packageName);
    await fs.writeFile(file, content, "utf8");
  }
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateImportStatements() {
  process.stdout.write(colors.yellow("Updating import statements..."));
  const files = await fg.sync(`**/*.{ts,tsx}`, {
    cwd: PACKAGE_PATH,
    absolute: true,
  });
  for (const file of files) {
    let content = await fs.readFile(file, "utf8");
    content = content.replace(/\.tsx?(['"])/g, ".js$1");
    await fs.writeFile(file, content, "utf8");
  }
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function changeFileExtensions() {
  process.stdout.write(colors.yellow("Changing file extensions..."));
  const files = await fg.sync(`**/*.{ts,tsx}`, {
    cwd: PACKAGE_PATH,
    absolute: true,
    dot: true,
  });
  for (const file of files) {
    const newFile = file.replace(/\.(ts|tsx)$/, ".js");
    await fs.rename(file, newFile);
  }
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updatePackageJson() {
  process.stdout.write(colors.yellow("Updating package.json..."));
  const packageJsonPath = path.join(PACKAGE_PATH, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  const devDeps = [
    "ts-jest",
    "typescript",
    "typescript-eslint",
    "@types/jest",
    "@types/react",
    "@types/react-dom",
    "@rollup/plugin-typescript",
    "rollup-plugin-dts",
  ];
  for (const dep of devDeps) {
    delete packageJson.devDependencies[dep];
  }
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateJestConfig() {
  process.stdout.write(colors.yellow("Updating Jest config..."));
  const jestConfigPath = path.join(PACKAGE_PATH, "jest.config.mjs");
  let content = await fs.readFile(jestConfigPath, "utf8");
  content = content.replace(/ts-jest/g, "jest");
  await fs.writeFile(jestConfigPath, content, "utf8");
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateEslintConfig() {
  process.stdout.write(colors.yellow("Updating ESLint config..."));
  const eslintConfigPath = path.join(PACKAGE_PATH, "eslint.config.mjs");
  let content = await fs.readFile(eslintConfigPath, "utf8");
  content = content.replace(/import tseslint from "typescript-eslint";\n/g, "");
  content = content.replace(/...tseslint.configs.recommended,\n/g, "");
  await fs.writeFile(eslintConfigPath, content, "utf8");
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateSwcConfig() {
  process.stdout.write(colors.yellow("Updating SWC config..."));
  const swcConfigPath = path.join(PACKAGE_PATH, ".swcrc");
  let config = await fs.readJson(swcConfigPath);
  config.jsc.parser.syntax = "ecmascript";
  config.jsc.parser.jsx = true;
  delete config.jsc.parser.tsx;
  await fs.writeJson(swcConfigPath, config, { spaces: 2 });
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateStorybookConfig() {
  process.stdout.write(colors.yellow("Updating Storybook config..."));
  const storybookConfigPath = path.join(PACKAGE_PATH, ".storybook/main.js");
  let content = await fs.readFile(storybookConfigPath, "utf8");
  content = content.replace(
    /config.module.rules = config.module.rules.filter\(\(rule\) => !rule.test\?.toString\(\).includes\("tsx"\)\);\n/g,
    ""
  );

  content = content.replace(
    /config.module.rules.push\({\n\s+test: \/\.\(js\|mjs\|jsx\|ts\|tsx\)\$\/,\n\s+exclude: \/node_modules\/,\n\s+use: {\n\s+loader: getAbsolutePath\("swc-loader"\),\n\s+options: {\n\s+jsc: swcrc.jsc,\n\s+},\n\s+},\n\s+}\);\n/g,
    ""
  );

  content = content.replace(
    /import type { StorybookConfig } from "@storybook\/react-webpack5";\n/g,
    ""
  );

  content = content.replace(
    /function getAbsolutePath\(value: string\): any {/g,
    "function getAbsolutePath(value) {"
  );

  content = content.replace(
    /const config: StorybookConfig = {/g,
    "const config = {"
  );

  await fs.writeFile(storybookConfigPath, content, "utf8");
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateStorybookPreview() {
  process.stdout.write(colors.yellow("Updating Storybook preview..."));
  const storybookPreviewPath = path.join(PACKAGE_PATH, ".storybook/preview.js");
  let content = await fs.readFile(storybookPreviewPath, "utf8");
  content = content.replace(
    /import type { Preview } from "@storybook\/react";\n/g,
    ""
  );
  content = content.replace(/const preview: Preview = {/g, "const preview = {");
  await fs.writeFile(storybookPreviewPath, content, "utf8");
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function installDependencies() {
  console.info(colors.yellow("Installing dependencies..."));
  spawnSync("npm", ["i"], {
    stdio: "inherit",
    shell: true,
    cwd: PACKAGE_PATH,
  });
}

async function updateRollupConfig() {
  process.stdout.write(colors.yellow("Updating Rollup config..."));
  const rollupConfigPath = path.join(PACKAGE_PATH, "rollup.config.mjs");
  let content = await fs.readFile(rollupConfigPath, "utf8");
  content = content.replace(/\.ts(['"])/g, ".js$1");
  content = content.replace(
    /import typescript from "@rollup\/plugin-typescript";\n/g,
    ""
  );
  content = content.replace(/import dts from "rollup-plugin-dts";\n/g, "");

  content = content.replace(/typescript\(\{[\s\S]*?\}\),?\n?/gm, "");

  await fs.writeFile(rollupConfigPath, content, "utf8");
  await spawnSync("npx", ["prettier", "--write", rollupConfigPath], {
    stdio: "inherit",
  });
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

(async () => {
  if (await fs.pathExists(PACKAGE_PATH)) await fs.remove(PACKAGE_PATH);

  await cleanupTemplateFolder();

  await fs.copy(path.join(TEMPLATES_PATH, "ts-react-library"), PACKAGE_PATH);

  await updatePackageNameReferences();

  if (!options.typescript) {
    await updateImportStatements();
    await changeFileExtensions();
    await updatePackageJson();
    await updateJestConfig();
    await updateEslintConfig();
    await updateSwcConfig();
    await updateStorybookConfig();
    await updateStorybookPreview();
    await updateRollupConfig();
  }

  // await installDependencies();
})();
