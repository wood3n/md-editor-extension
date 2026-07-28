import { defineConfig } from "@rsbuild/core"
import { pluginReact } from "@rsbuild/plugin-react"
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss"

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  environments: {
    web: {
      source: {
        entry: { index: "./src/main.tsx" },
      },
      output: {
        distPath: {
          root: "dist",
          html: ".",
          js: "static/js",
          css: "static/css",
        },
      },
    },
    worker: {
      source: {
        entry: { "service-worker": "./src/background/service-worker.ts" },
      },
      output: {
        target: "web-worker",
        filename: {
          js: "[name].js",
        },
        distPath: {
          root: "dist",
          js: ".",
        },
      },
    },
  },
  server: {
    publicDir: false,
  },
  dev: {
    writeToDisk: true,
    lazyCompilation: false,
  },
  output: {
    copy: [{ from: "./public" }],
  },
})
