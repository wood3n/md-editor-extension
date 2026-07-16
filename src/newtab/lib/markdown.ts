import MarkdownIt from "markdown-it";
import frontMatter from "markdown-it-front-matter";
import taskLists from "markdown-it-task-lists";
import { fromHighlighter } from "@shikijs/markdown-it";
import { createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// ── Front matter ──

let _frontMatter: Record<string, unknown> = {};

export function getFrontMatter(): Record<string, unknown> {
  return _frontMatter;
}

// ── Escape helper for mermaid ──

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Cached markdown-it + shiki instance ──

const jsEngine = createJavaScriptRegexEngine();

let _md: MarkdownIt | null = null;
let _currentTheme = "";

export async function getOrCreateRenderer(theme: string): Promise<MarkdownIt> {
  // Reuse if theme hasn't changed
  if (_md && _currentTheme === theme) return _md;

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  // Front matter
  md.use(frontMatter, (fm: string) => {
    _frontMatter = {};
    if (fm) {
      try {
        for (const line of fm.trim().split("\n")) {
          const idx = line.indexOf(":");
          if (idx > 0) {
            _frontMatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
          }
        }
      } catch { /* ignore */ }
    }
  });

  // Task lists
  md.use(taskLists);

  // Shiki with JS regex engine (no WASM)
  const highlighter = await createHighlighter({
    themes: [theme],
    langs: [
      "javascript", "typescript", "tsx", "jsx",
      "python", "rust", "go", "java", "c", "cpp", "csharp",
      "html", "css", "scss", "json", "yaml", "xml",
      "bash", "shell", "sh", "powershell",
      "sql", "graphql",
      "markdown", "mdx",
      "dockerfile", "toml", "ini", "dotenv",
      "ruby", "php", "swift", "kotlin",
      "lua", "r", "dart",
      "nginx", "makefile", "cmake",
      "diff", "git-commit", "git-rebase",
      "vue", "svelte", "astro",
      "viml", "vim",
    ],
    engine: jsEngine,
  });

  // `text` is a valid special language at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.use(fromHighlighter(highlighter, { theme, fallbackLanguage: "text" as any }));

  // Override fence for mermaid (after shiki plugin)
  const shikiFence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();
    if (info === "mermaid" || info.startsWith("mermaid ")) {
      return `<div class="mermaid">\n${escapeHtml(token.content)}\n</div>\n`;
    }
    return shikiFence(tokens, idx, options, env, self);
  };

  _md = md;
  _currentTheme = theme;
  return md;
}

export function renderMarkdown(md: MarkdownIt, text: string): string {
  return md.render(text);
}
