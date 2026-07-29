import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { defineConfig, logger } from "@rsbuild/core"
import { pluginReact } from "@rsbuild/plugin-react"
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss"

import manifestTemplate from "./manifest"

export default defineConfig({
  html: {
    title: "MD Editor",
  },
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
    {
      name: "generate-manifest",
      setup(api) {
        api.onBeforeCreateCompiler(() => {
          const root = process.cwd()
          const pkg = JSON.parse(
            readFileSync(resolve(root, "package.json"), "utf8"),
          )
          const manifest = { ...manifestTemplate, version: pkg.version }
          const outputPath = resolve(root, "public", "manifest.json")
          writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)
          logger.success(`[manifest-version]: ${pkg.version}`)
        })
      },
    },
  ],
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
    content: {
      source: {
        entry: { "md-banner": "./src/content/md-banner.ts" },
      },
      output: {
        target: "web-worker",
        filename: {
          js: "[name].js",
        },
        distPath: {
          root: "dist",
          js: "content-scripts",
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
