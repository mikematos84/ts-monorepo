import prompts from "prompts";
import { program } from "commander";
import path, { format } from "path";
import colors from "colors";
import fs from "fs-extra";
import fg from "fast-glob";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "./utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = path.join(__dirname, "../");
const SCRIPT_PATH = __dirname;
const TEMPLATES_PATH = path.join(SCRIPT_PATH, "templates");
const TRANSFORMS_PATH = path.join(SCRIPT_PATH, "transforms");

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

async function updatePackageJsonForJs() {
  console.info(colors.yellow("Removing TypeScript-related modules..."));
  const packageJson = await fs.readJSON(path.join(packagePath, "package.json"));

  // remove "types" field
  delete packageJson.types;

  // remove TypeScript-related dependencies
  const modules = [
    "@rollup/plugin-typescript",
    "@types/jest",
    "@types/react",
    "@types/react-dom",
    "ts-jest",
    "typescript",
    "typescript-eslint",
  ];

  // delete the modules from peerDependencies if they exist
  if (packageJson.peerDependencies) {
    modules.forEach((module) => {
      delete packageJson.peerDependencies[module];
    });
  }

  // delete the modules from devDependencies if they exist
  if (packageJson.devDependencies) {
    modules.forEach((module) => {
      delete packageJson.devDependencies[module];
    });
  }

  // delete the modules from dependencies if they exist
  if (packageJson.dependencies) {
    modules.forEach((module) => {
      delete packageJson.dependencies[module];
    });
  }

  await fs.writeJSON(path.join(packagePath, "package.json"), packageJson, {
    spaces: 2,
  });

  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function updateSwcConfigForJs() {
  console.info(colors.yellow("Updating SWC configuration..."));
  const swcConfig = await fs.readJSON(path.join(packagePath, ".swcrc"));

  const { syntax, tsx, ...rest } = swcConfig.jsc.parser;

  swcConfig.jsc.parser = {
    syntax: "ecmascript",
    jsx: true,
    ...rest,
  };

  delete swcConfig.jsc.parser.tsx;

  await fs.writeJSON(path.join(packagePath, ".swcrc"), swcConfig, {
    spaces: 2,
  });
  process.stdout.write(colors.green(" SUCCESS!\n"));
}

async function renameFilesExtensions() {
  const files = await fg.sync(["**/*.ts", "**/*.tsx"], {
    cwd: PACKAGE_PATH,
    absolute: true,
    dot: true,
  });

  for (const file of files) {
    const newFileName = file.replace(/\.tsx?$/, ".js");
    await fs.rename(file, newFileName);
  }
}

(async () => {
  if (await fs.pathExists(PACKAGE_PATH)) await fs.remove(PACKAGE_PATH);

  await cleanupTemplateFolder();

  await fs.copy(path.join(TEMPLATES_PATH, "ts-react-library"), PACKAGE_PATH);

  await updatePackageNameReferences();

  if (!options.typescript) {
    // const typescriptFiles = await fg
    //   .sync(["**/*.ts", "**/*.tsx"], {
    //     cwd: PACKAGE_PATH,
    //     absolute: true,
    //     dot: true,
    //   })
    //   .join(" ");

    // await spawnSync(
    //   `jscodeshift -t ${TRANSFORMS_PATH}/convert-ts-to-js.mjs ${typescriptFiles} --parser=tsx`
    // );

    // await spawnSync(
    //   `jscodeshift -t ${TRANSFORMS_PATH}/remove-ts-from-eslint-config.mjs ${path.join(
    //     PACKAGE_PATH,
    //     "eslint.config.mjs"
    //   )} --parser=tsx`
    // );

    await spawnSync(
      `jscodeshift -t ${TRANSFORMS_PATH}/update-storybook-webpack-config-for-js.mjs ${path.join(
        PACKAGE_PATH,
        ".storybook/main.ts"
      )} --parser=tsx`
    );

    // await updatePackageJsonForJs();

    // await updateSwcConfigForJs();

    // await renameFilesExtensions();
  }

  // // Install dependencies
  // await spawnSync("npm install", { cwd: PACKAGE_PATH });

  // // Run storybook
  // await spawnSync("npm run storybook", { cwd: PACKAGE_PATH });
})();
