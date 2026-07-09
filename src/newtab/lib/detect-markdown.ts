const MARKDOWN_EXTENSIONS = /\.(md|markdown|mdown|mkd)(\?.*)?$/i;

export function isMarkdownUrl(url: string): boolean {
  if (!url) return false;
  return MARKDOWN_EXTENSIONS.test(url);
}

export function getMdParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("md");
}
