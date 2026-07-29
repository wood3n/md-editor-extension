import mermaid from "mermaid"
import {
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef,
  useEffect,
} from "react"
import type { Highlighter } from "shiki"

import { ThemeList } from "@/constants"
import { useDoc } from "@/context/doc"
import { useTheme } from "@/hooks/use-theme"

import {
  parseFrontMatter,
  createMarkdownItInstance,
  createFenceRule,
} from "./md"

interface Props {
  highlighter: Highlighter | null
  onScroll?: () => void
}

export interface MDPreviewHandle {
  scrollContainer: HTMLDivElement | null
}

export const MDPreview = forwardRef<MDPreviewHandle, Props>(
  ({ highlighter, onScroll }: Props, ref) => {
    const { theme } = useTheme()
    const mdContent = useDoc((state) => state.content)
    const scrollRef = useRef<HTMLDivElement>(null)

    const markdownItInstanceRef = useRef(createMarkdownItInstance())

    const { yaml, html } = useMemo(() => {
      markdownItInstanceRef.current.renderer.rules.fence = createFenceRule({
        highlighter,
        theme,
      })

      const { yaml: frontMatter, body } = parseFrontMatter(mdContent)
      return {
        yaml: frontMatter,
        html: markdownItInstanceRef.current.render(body),
      }
    }, [mdContent, highlighter, theme])

    // Re-initialize mermaid when dark/light theme changes
    useEffect(() => {
      const entry = ThemeList.find((t) => t.id === theme)
      const isDark = entry?.dark ?? false

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        securityLevel: "loose",
      })
    }, [theme])

    // Render mermaid diagrams after HTML content is committed to the DOM
    useEffect(() => {
      const container = scrollRef.current
      if (!container) {
        return
      }

      const blocks =
        container.querySelectorAll<HTMLDivElement>(".mermaid-block")
      if (blocks.length === 0) {
        return
      }

      // Convert placeholder divs into mermaid source divs
      blocks.forEach((block) => {
        const source = block.dataset.mermaid ?? ""
        block.removeAttribute("data-mermaid")
        block.classList.remove("mermaid-block")
        block.classList.add("mermaid")
        block.textContent = source
      })

      mermaid.run({
        querySelector: ".mermaid",
        suppressErrors: true,
      })
    }, [html])

    useImperativeHandle(ref, () => ({
      get scrollContainer() {
        return scrollRef.current
      },
    }))

    return (
      <div
        ref={scrollRef}
        className="markdown-body h-full overflow-y-auto p-4"
        onScroll={onScroll}
      >
        {Boolean(yaml) && <div className="markdown-front-matter">{yaml}</div>}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  },
)
