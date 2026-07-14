import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "./package.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        name: "MD Editor",
        version: pkg.version,
        description: "A Markdown editor and previewer with Mermaid support",
        action: {
          default_title: "MD Editor",
          default_icon: {
            "16": "icons/icon16.png",
            "32": "icons/icon32.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png",
          },
        },
        icons: {
          "16": "icons/icon16.png",
          "32": "icons/icon32.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png",
        },
        permissions: ["activeTab", "storage", "scripting"],
        host_permissions: ["<all_urls>"],
        background: {
          service_worker: "src/background/service-worker.ts",
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        newtab: path.resolve(__dirname, "src/newtab.html"),
      },
    },
  },
});
