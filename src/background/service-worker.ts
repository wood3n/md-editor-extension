import { savePreloadContent } from "@/lib/storage"

// Listen for content script click to open editor with preloaded content
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "open-markdown" && sender.tab?.id) {
    savePreloadContent(message.url, message.content)
    const editorUrl = chrome.runtime.getURL(
      `index.html?md=${encodeURIComponent(message.url)}&local=true`,
    )
    chrome.tabs.create({ url: editorUrl })
  }
})


chrome.action.onClicked.addListener(() => {
  const newTabUrl = chrome.runtime.getURL("index.html")
  chrome.tabs.create({ url: newTabUrl })
})
