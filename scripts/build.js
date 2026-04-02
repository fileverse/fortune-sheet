const fs = require("fs");
const { spawnSync } = require("child_process");

const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json"));

const commonTsconfig = {
  ...tsconfig,
  include: ["./src"],
  exclude: [
  "node_modules",
  "**/*.test.ts",
  "**/*.spec.ts",
  "dist",
  "lib",
  ],
};

const coreTsconfig = {
  ...commonTsconfig,
  compilerOptions: {
    ...commonTsconfig.compilerOptions,
    baseUrl: "./",
    paths: {
      "@fileverse-dev/fortune-core": ["src"],
    },
  },
};

const reactTsconfig = {
  ...commonTsconfig,
  compilerOptions: {
    ...commonTsconfig.compilerOptions,
    baseUrl: "./",
    rootDir: "..",
    paths: {
      "@fileverse-dev/fortune-core": ["../core/src"],
      "@fortune-sheet/react": ["src"],
    },
  },
};

fs.writeFileSync("packages/core/tsconfig.json", JSON.stringify(coreTsconfig));
fs.writeFileSync("packages/react/tsconfig.json", JSON.stringify(reactTsconfig));

spawnSync("father-build", { stdio: "inherit" });

fs.rmSync("packages/core/tsconfig.json");
fs.rmSync("packages/react/tsconfig.json");
