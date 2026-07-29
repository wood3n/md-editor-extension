// Injected on raw markdown pages to prompt opening in the extension editor.
// Detect: body has a single <pre> as its only meaningful child.
const body = document.body

if (
  body &&
  body.children.length === 1 &&
  body.firstElementChild?.tagName === "PRE"
) {
  const content = body.firstElementChild.textContent || ""
  if (content.trim()) {
    injectBanner(content)
  }
}

function injectBanner(content: string) {
  const banner = document.createElement("div")
  banner.id = "md-editor-banner"
  banner.textContent = "📝 Open in MD Editor"

  const style = banner.style
  style.position = "sticky"
  style.top = "0"
  style.zIndex = "2147483647"
  style.padding = "6px 16px"
  style.background = "#0969da"
  style.color = "#fff"
  style.cursor = "pointer"
  style.fontSize = "13px"
  style.textAlign = "center"
  style.userSelect = "none"
  style.opacity = "0.92"

  banner.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "open-markdown",
      url: location.href,
      content,
    })
  })

  document.body.prepend(banner)
}
