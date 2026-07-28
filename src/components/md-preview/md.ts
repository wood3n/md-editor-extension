import markdownit from "markdown-it"
import container from "markdown-it-container"
import markdownItDeflist from "markdown-it-deflist"
import { full as markdownItEmoji } from "markdown-it-emoji"
import markdownItFootnote from "markdown-it-footnote"
import markdownItIns from "markdown-it-ins"
import markdownItMark from "markdown-it-mark"
import markdownItSub from "markdown-it-sub"
import markdownItSup from "markdown-it-sup"
import taskLists from "markdown-it-task-lists"
import type Token from "markdown-it/lib/token.mjs"
import type { Highlighter } from "shiki"

import { type Theme } from "@/context/theme"
import { escapeHtml } from "@/lib/utils"

export function createMarkdownItInstance({
  highlighter,
  getTheme,
}: {
  highlighter: Highlighter | null
  getTheme: () => Theme
}) {
  const md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
  })

  md.use(markdownItSub)
  md.use(markdownItSup)
  md.use(markdownItIns)
  md.use(markdownItMark)
  md.use(markdownItFootnote)
  md.use(markdownItDeflist)
  md.use(markdownItEmoji)
  md.use(taskLists)

  // ── Admonitions (Docusaurus-style) ──
  const admonitionIcons: Record<string, string> = {
    note: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    tip: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8a6 6 0 00-12 0c0 1.61.67 3 1.5 3.5.76.76 1.23 1.52 1.41 2.5z"/></svg>`,
    info: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    danger: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.5-4.24 2-6 2.5 1.76 3.07 3.86 2 6-.5 1-.96 1.62-1 3a2.5 2.5 0 002.5 2.5"/><path d="M12 22c-3.78 0-7.15-2.55-8.42-6 .3-3.5 2.9-6.18 6.42-7.24M12 22c3.78 0 7.15-2.55 8.42-6-.3-3.5-2.9-6.18-6.42-7.24"/></svg>`,
  }

  const admonitionLabels: Record<string, string> = {
    note: "NOTE",
    tip: "TIP",
    info: "INFO",
    warning: "WARNING",
    danger: "DANGER",
  }

  const admonitionTypes = Object.keys(admonitionLabels)

  for (const type of admonitionTypes) {
    md.use(container, type, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(tokens: any[], idx: number): string {
        const token = tokens[idx]
        if (token.nesting === 1) {
          const rawParams = token.info.trim()
          const title = rawParams || admonitionLabels[type]
          const icon = admonitionIcons[type]
          return (
            `<div class="admonition admonition-${type}">\n` +
            `<div class="admonition-heading">${icon}<span>${escapeHtml(title)}</span></div>\n` +
            `<div class="admonition-body">\n`
          )
        }
        return "</div>\n</div>\n"
      },
    })
  }

  md.renderer.rules.fence = (tokens: Token[], idx: number) => {
    const token = tokens[idx]
    const rawLang = (token.info ?? "").trim().split(/\s+/)[0].toLowerCase()

    // Mermaid: emit a placeholder div, rendered later by useEffect
    if (rawLang === "mermaid") {
      const escaped = token.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
      return `<div class="mermaid-block" data-mermaid="${escaped}"></div>`
    }

    if (!highlighter) {
      const escaped = token.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
      return `<pre class="shiki-fallback"><code>${escaped}</code></pre>`
    }

    try {
      return highlighter.codeToHtml(token.content, {
        lang: rawLang,
        theme: getTheme(),
      })
    } catch {
      const escaped = token.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
      return `<pre class="shiki-fallback"><code>${escaped}</code></pre>`
    }
  }

  return md
}

export function parseFrontMatter(raw: string): {
  yaml: string | null
  body: string
} {
  const trimmed = raw.startsWith("\ufeff") ? raw.slice(1) : raw
  if (!trimmed.startsWith("---")) {
    return { yaml: null, body: raw }
  }

  const end = trimmed.indexOf("\n---", 3)
  if (end === -1) {
    return { yaml: null, body: raw }
  }

  const yaml = trimmed.slice(3, end).trim()
  const body = trimmed.slice(end + 4).replace(/^\n/, "")
  return { yaml: yaml || null, body }
}
