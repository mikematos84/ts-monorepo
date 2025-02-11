# ts-monorepo

## Setup

Setup the core folder structure of the monorepo

```bash
# Initialize repo
npm init -y
# Create apps and packages directories
mkdir -p apps packages
```

Add **workspaces** to package.json

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

## Creating an app

```bash
# Navigate to apps directory
cd apps
# Create an app, we will use NextJS for our purposes
npx create-next-app
# Follow the prompts in create-next-app to build and configure your Next app
```

## Creating a package

```bash
# Navigate to the packages directory
cd packages
# Create a directory for your package
mkdir -p react-ui-library
# Naviate into that package
cd react-ui-library
# Initialize package
npm init -y
```

Update the name in the package.json, if desired, to include a **scope**. The scope is optional but suggested in a monorepo as often you are publishing multiple packages and this helps to make those packages more uniquely identifiable able and avoid collision with other packages that may share the same package name

```json
{
  "name": "@scope/react-ui-library
}
```

Setting up React
```bash
# Setup React
npm i -D react react-dom
```
Setting up Typescript
```bash
# Setup Typescript (Optional)
npm i -D typescript @types/react @types/react-dom
```
