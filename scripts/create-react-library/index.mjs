import prompts from "prompts";
import { program } from "commander";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import merge from "deepmerge";

// helpers
import { formatTemplateLiteral } from "../utils/formatTemplateLiteral.mjs";
import { getPackageName } from "../utils/getPackageName.mjs";
import { getPackageJson } from "../utils/getPackageJson.mjs";
import { generateGitUrl } from "../utils/generateGitUrl.mjs";
import { validatePackageName } from "../utils/validatePackageName.mjs";
import { spawnSync } from "../utils/spawnSync.mjs";

import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = path.join(__dirname, "../../");
const SCRIPT_PATH = __dirname;
const TEMPLATE_PATH = path.join(SCRIPT_PATH, "template");

let PACKAGE_PATH = null;

let depsToInstall = [];

// Define command-line options
program
  .option("-n, --package-name <string>", "Package name")
  .option("-t, --typescript [boolean]", "Use typescript?");

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
    validate: validatePackageName,
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

(async () => {
  const response = await prompts(questions);

  // Merge the command-line options with the prompt responses
  const options = { ...inputs, ...response };
  const [scope, packageName] = options.packageName.includes("/")
    ? options.packageName.split("/")
    : [null, options.packageName];

  PACKAGE_PATH = path.join(ROOT_PATH, "packages", packageName);
  const packagePath = path.join(ROOT_PATH, "packages", packageName);

  // cleanup the package folder if it already exists
  if (existsSync(packagePath)) {
    await fs.rm(packagePath, { recursive: true });
  }

  // create a folder with the package name under packages using fs
  await fs.mkdir(packagePath);
  // navigate to the package folder
  process.chdir(packagePath);
  // initialize a new npm package with npm init -y
  await spawnSync(`npm init -y ${scope ? `--scope=${scope}` : ""}`);
  // update the package.json for npm
  await updatePackageJson(options, packagePath);

  // install react and react-dom
  await spawnSync("npm i react react-dom --save-peer");

  // if using typescript
  if (options.typescript) {
    // install typescript and types for react and react-dom
    await spawnSync("npm i -D typescript @types/react @types/react-dom");
    // Write a tsconfig.json file with the necessary configuration for a React library
    await createTsConfig();
  }

  // create a rollup.config.js file with the necessary configuration
  await createRollupConfig();

  // copy src from the template folder to the package folder
  await spawnSync(`cp -r ${path.join(TEMPLATE_PATH, "src")} ./src`);

  // setup eslint
  await setupEslint(options);

  // setup jest
  await setupJest(options);

  // run eslint
  await spawnSync("npm run lint");
  // run tests
  await spawnSync("npm test");
  // run build command
  await spawnSync("npm run build");
})();

async function setupJest(options) {
  const { typescript } = options;

  const jestSetup = formatTemplateLiteral`
    import "@testing-library/jest-dom/extend-expect";
  `;

  await fs.mkdir(path.join(PACKAGE_PATH, ".config"), { recursive: true });
  await fs.writeFile(
    path.join(PACKAGE_PATH, ".config/setup-jest.js"),
    jestSetup,
    "utf-8"
  );

  const jestConfig = formatTemplateLiteral`
    module.exports = async () => {
      return {
        preset: ${typescript ? '"ts-jest"' : "undefined"},
        testEnvironment: "jsdom",
        setupFilesAfterEnv: ["<rootDir>/.config/setup-jest.js"],
        testPathIgnorePatterns: ["/node_modules/", "/dist/"],
        moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      }
    };
  `;
  await fs.writeFile("jest.config.js", jestConfig, "utf-8");

  modifyPackageJson(path.join(PACKAGE_PATH, "package.json"), {
    scripts: {
      test: "jest",
    },
  });

  // write a sample test file for src/components/HelloWord that just makes sure it renders without crashing
  const testContent = formatTemplateLiteral`
    import React from "react";
    import { render, screen } from "@testing-library/react";
    import HelloWord from ".";

    test("renders HelloWord", () => {
      render(<HelloWord />);
      const element = screen.getByText(/HelloWord/i);
      expect(element).toBeInTheDocument();
    });
  `;
  await fs.writeFile(
    path.join(PACKAGE_PATH, "src/components/HelloWord/HelloWord.test.tsx"),
    testContent,
    "utf-8"
  );

  const deps = [
    "jest",
    "react-test-renderer",
    "jest-environment-jsdom",
    "jest-watch-typeahead",
    "@testing-library/jest-dom",
    "@testing-library/react",
    ...(typescript ? ["ts-jest", "@types/jest"] : []),
  ];

  depsToInstall.push(deps.map((dep) => ({ name: dep, type: "dev" })));

  await spawnSync(`npm i -D ${deps.join(" ")}`);
}

async function setupEslint(options) {
  const { typescript } = options;

  const deps = [
    "eslint",
    "globals",
    "@eslint/js",
    "eslint-plugin-react",
    ...(typescript ? ["typescript-eslint"] : []),
  ];

  await spawnSync(`npm i -D ${deps.join(" ")}`);

  // copy eslint config from template folder to the package folder
  await spawnSync(
    `cp ${path.join(
      SCRIPT_PATH,
      `template/eslint.config${typescript ? ".typescript" : ""}.mjs`
    )} ./eslint.config.mjs`
  );

  modifyPackageJson(path.join(PACKAGE_PATH, "package.json"), {
    scripts: {
      lint: "eslint src --fix",
    },
  });
}

// Modifies the package.json file to include the main, module, and types fields
async function updatePackageJson(options, packagePath) {
  const rootPackageJson = await getPackageJson();

  const originalPackageJson = await getPackageJson(packagePath);
  const { name, version, description, main, ...rest } = originalPackageJson;

  return modifyPackageJson(path.join(packagePath, "package.json"), {
    name,
    version,
    description,
    main: "dist/cjs/index.js",
    module: "dist/esm/index.js",
    ...(options.typescript && {
      types: "dist/index.d.ts",
    }),
    files: ["dist"],
    directories: {
      doc: "docs",
    },
    bugs: {
      url: generateGitUrl(rootPackageJson, "issues"),
    },
    homepage: generateGitUrl(rootPackageJson, `#readme`),
    repository: {
      type: "git",
      url: generateGitUrl(rootPackageJson),
      directory: `packages/${getPackageName(originalPackageJson)}`,
    },
    publishConfig: {
      registry: "https://npm.pkg.github.com/",
    },
    ...rest,
  });
}

// create a function to setup rollup to bundle the library
async function createRollupConfig(packagePath = ".") {
  // install the necessary dependencies
  const deps = [
    "rollup",
    "rollup-plugin-typescript2",
    "@rollup/plugin-commonjs",
    "@rollup/plugin-node-resolve",
    "rollup-plugin-peer-deps-external",
  ];

  await spawnSync(`npm i -D ${deps.join(" ")}`);

  const content = formatTemplateLiteral`
      import typescript from "rollup-plugin-typescript2";
      import commonjs from "@rollup/plugin-commonjs";
      import resolve from "@rollup/plugin-node-resolve";
      import peerDepsExternal from "rollup-plugin-peer-deps-external";

      /** @type {import('rollup').RollupOptions} */
      export default {
        input: "src/index.ts",
        external: ["react", "react-dom"],
        output: [
          {
            dir: "dist/cjs",
            format: "cjs",
            exports: "named",
          },
          {
            dir: "dist/esm",
            format: "esm",
            preserveModules: true,
          },
        ],
        plugins: [
          peerDepsExternal(),
          resolve(),
          commonjs(),
          typescript({ useTsconfigDeclarationDir: true }),
        ],
      };
  `;

  await modifyPackageJson(path.join(packagePath, "package.json"), {
    scripts: {
      build: "rollup -c",
    },
  });

  return fs.writeFile(path.join(packagePath, "rollup.config.mjs"), content, {
    encoding: "utf-8",
  });
}

async function modifyPackageJson(path, options) {
  // read package json  file
  const packageJson = JSON.parse((await fs.readFile(path, "utf-8")) || {});
  // update package json file
  const next = merge(packageJson, options);
  // write package json file
  return fs.writeFile(path, JSON.stringify(next, null, 2), "utf-8");
}

async function createTsConfig() {
  const tsconfig = {
    compilerOptions: {
      target: "es5", // Specify ECMAScript target version
      module: "esnext", // Specify module code generation
      jsx: "react-jsx", // Specify JSX code generation
      moduleResolution: "node", // Specify module resolution strategy
      strict: true, // Enable all strict type-checking options
      esModuleInterop: true, // Enable interoperability between CommonJS and ES Modules
      skipLibCheck: true, // Skip type checking of declaration files
      forceConsistentCasingInFileNames: true, // Disallow inconsistently-cased references to the same file
      lib: ["dom", "esnext"], // Specify library files to be included in the compilation
      types: ["react", "react-dom"], // Specify type definitions to be included
      allowJs: true, // Allow JavaScript files to be compiled
      declaration: true, // Generate .d.ts files
      outDir: "dist", // Redirect output structure to the directory
      rootDir: "src", // Specify the root directory of input files
      isolatedModules: true, // Ensure each file can be safely transpiled without relying on other imports
      // Do not emit outputs
    },
    include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"], // Specify which files to include
    exclude: [
      "node_modules",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.spec.js",
      "**/*.spec.jsx",
    ], // Specify which files to exclude
  };

  return fs.writeFile("tsconfig.json", JSON.stringify(tsconfig, null, 2));
}
