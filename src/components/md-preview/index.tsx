import mermaid from "mermaid"
import { useImperativeHandle, useMemo, useRef, forwardRef } from "react"
import type { Highlighter } from "shiki"

import { useDoc } from "@/context/doc"
import { useTheme } from "@/hooks/use-theme"

import { parseFrontMatter, createMarkdownItInstance } from "./md"

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
})

interface Props {
  highlighter: Highlighter | null
  onScroll?: () => void
}

export interface MDPreviewHandle {
  scrollContainer: HTMLDivElement | null
}

export const MDPreview = forwardRef<MDPreviewHandle, Props>(
  function MDPreview({ highlighter, onScroll }: Props, ref) {
    const { theme } = useTheme()
    const mdContent = useDoc((state) => state.content)
    const scrollRef = useRef<HTMLDivElement>(null)
    const markdownItInstance = useMemo(
      () =>
        createMarkdownItInstance({
          highlighter,
          getTheme: () => theme,
        }),
      [theme, highlighter],
    )

    const { yaml, html } = useMemo(() => {
      const { yaml: frontMatter, body } = parseFrontMatter(mdContent)
      return { yaml: frontMatter, html: markdownItInstance.render(body) }
    }, [mdContent, markdownItInstance])

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
