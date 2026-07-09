/// <reference types="chrome" />

const MARKDOWN_EXTENSIONS = /\.(md|markdown|mdown|mkd)(\?.*)?$/i;
const STORAGE_KEY_PREFIX = "md_preload_";

function isMarkdownUrl(url: string): boolean {
  if (!url) return false;
  return MARKDOWN_EXTENSIONS.test(url);
}

/**
 * Try to read the current tab's text content from its DOM.
 * Returns the page text, or null if it cannot be read.
 */
async function readTabContent(tabId: number): Promise<string | null> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (): string => {
        // For Chrome's raw text wrapper, content is in <pre>
        const pre = document.body.querySelector("pre");
        return pre ? pre.textContent || "" : document.body.innerText || "";
      },
    });
    const content = results[0]?.result;
    return typeof content === "string" && content.trim() ? content : null;
  } catch {
    // Script injection may fail on restricted pages (chrome://, etc.)
    return null;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  const url = tab.url || "";

  if (isMarkdownUrl(url)) {
    // Try to read content directly from the page DOM first
    const localContent = await readTabContent(tab.id!);

    if (localContent) {
      // Store content so the editor can read it without a network request
      const storageKey = STORAGE_KEY_PREFIX + url;
      await chrome.storage.local.set({
        [storageKey]: { content: localContent, timestamp: Date.now() },
      });
    }

    // Replace current tab with editor; &local=true signals preloaded content
    const localParam = localContent ? "&local=true" : "";
    const editorUrl = chrome.runtime.getURL(
      `src/newtab.html?md=${encodeURIComponent(url)}${localParam}`
    );
    await chrome.tabs.update(tab.id!, { url: editorUrl });
  } else {
    // Open empty editor in a new tab
    const newTabUrl = chrome.runtime.getURL("src/newtab.html");
    await chrome.tabs.create({ url: newTabUrl });
  }
});

export {};
