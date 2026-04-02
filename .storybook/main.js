module.exports = {
  // Only TS/JSX here — a stray API.stories.js next to API.stories.tsx duplicates
  // every story id and breaks indexing (e.g. after mistaken codegen).
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(jsx|ts|tsx)",
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },

  docs: {
    autodocs: "tag"
  }
};

