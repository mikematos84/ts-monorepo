import prompts from "prompts";
import { program } from "commander";
import path from "path";
import childProcess, { spawn } from "child_process";
import colors from "colors";
import fs from "fs-extra";
import fg from "fast-glob";

import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = path.join(__dirname, "../../");
const SCRIPT_PATH = __dirname;
const TEMPLATES_PATH = path.join(SCRIPT_PATH, "templates");
const CODEMODS_PATH = path.join(SCRIPT_PATH, "codemods");

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

async function runCodemod(
  transform,
  options = {
    parser: "tsx",
    extensions: "ts,tsx,js,jsx",
  }
) {
  return spawnSync(
    "npx",
    [
      "jscodeshift",
      "-t",
      path.join(CODEMODS_PATH, transform),
      PACKAGE_PATH,
      `--extensions=${options.extensions}`,
      `--parser=${options.parser}`,
    ],
    {
      stdio: "inherit",
      shell: true,
      encoding: "utf-8",
    }
  );
}

async function spawnSync(str) {
  const [command, ...args] = str.split(" ");
  return new Promise((resolve, reject) => {
    const process = childProcess.spawn(command, args, {
      stdio: "inherit",
      shell: true,
      encoding: "utf-8",
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}

(async () => {
  if (await fs.pathExists(PACKAGE_PATH)) await fs.remove(PACKAGE_PATH);

  await cleanupTemplateFolder();

  await fs.copy(path.join(TEMPLATES_PATH, "ts-react-library"), PACKAGE_PATH);

  await updatePackageNameReferences();

  if (!options.typescript) {
    await spawnSync(
      `jscodeshift -t ${CODEMODS_PATH}/convert-ts-to-js.mjs ${PACKAGE_PATH} --extensions=ts,tsx --parser=tsx`
    );
    await spawnSync(
      `jscodeshift -t ${CODEMODS_PATH}/remove-rollup-ts-config.mjs ${PACKAGE_PATH}/rollup.config.mjs --parser=tsx`
    );
    await spawnSync(
      `jscodeshift -t ${CODEMODS_PATH}/remove-storybook-ts-config.mjs ${PACKAGE_PATH}/.storybook/main.ts --parser=tsx`
    );
    await spawnSync(
      `jscodeshift -t ${CODEMODS_PATH}/remove-ts-packages.mjs ${PACKAGE_PATH}/package.json`
    );
    await spawnSync(
      `jscodeshift -t ${CODEMODS_PATH}/update-swcrc-for-js.mjs ${PACKAGE_PATH}/.swcrc --parser=tsx`
    );
    await changeFileExtensions();
  }

  // await installDependencies();
})();
