import type { StorybookConfig } from "@storybook/react-vite"

// @storybook/builder-vite loads apps/docs/vite.config.ts itself, so the workspace aliases and
// the Tailwind plugin declared there apply here too — no viteFinal override needed.
const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
}

export default config
