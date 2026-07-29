const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: "MD Editor",
  version: "-",
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
  permissions: ["activeTab", "storage", "unlimitedStorage"],
  host_permissions: ["<all_urls>", "file:///*"],
  content_scripts: [
    {
      matches: [
        "*://*/*.md",
        "*://*/*.markdown",
        "*://*/*.mdown",
        "*://*/*.mkd",
        "file:///*/*.md",
        "file:///*/*.markdown",
        "file:///*/*.mdown",
        "file:///*/*.mkd",
      ],
      js: ["content-scripts/md-banner.js"],
      run_at: "document_end",
    },
  ],
  background: {
    service_worker: "service-worker.js",
    type: "module",
  },
}

export default manifest
