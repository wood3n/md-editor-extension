import mermaid from "mermaid"
import {
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef,
  useEffect,
  useState,
} from "react"
import type { Highlighter } from "shiki"

import { ThemeList } from "@/constants"
import { useDoc } from "@/context/doc"
import { useTheme } from "@/hooks/use-theme"
import {
  getLocalImageId,
  getLocalImageIds,
  loadLocalImages,
} from "@/lib/doc-db"

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
    const defaultImageRendererRef = useRef(
      markdownItInstanceRef.current.renderer.rules.image,
    )
    const objectUrlsRef = useRef(new Map<string, string>())
    const [localImageSources, setLocalImageSources] = useState<
      Record<string, string>
    >({})
    const localImageIds = useMemo(
      () => getLocalImageIds(mdContent),
      [mdContent],
    )
    const localImageIdsKey = localImageIds.join(",")

    useEffect(() => {
      let cancelled = false
      const activeIds = new Set(localImageIds)

      objectUrlsRef.current.forEach((url, id) => {
        if (!activeIds.has(id)) {
          URL.revokeObjectURL(url)
          objectUrlsRef.current.delete(id)
        }
      })

      const missingIds = localImageIds.filter(
        (id) => !objectUrlsRef.current.has(id),
      )

      const updateSources = () => {
        const nextSources = Object.fromEntries(
          localImageIds.flatMap((id) => {
            const source = objectUrlsRef.current.get(id)
            return source ? [[id, source]] : []
          }),
        )
        setLocalImageSources(nextSources)
      }

      if (missingIds.length === 0) {
        updateSources()
        return
      }

      void loadLocalImages(missingIds).then((images) => {
        if (cancelled) {
          return
        }

        for (const [id, blob] of images) {
          objectUrlsRef.current.set(id, URL.createObjectURL(blob))
        }
        updateSources()
      })

      return () => {
        cancelled = true
      }
    }, [localImageIds, localImageIdsKey])

    useEffect(
      () => () => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        objectUrlsRef.current.clear()
      },
      [],
    )

    const { yaml, html } = useMemo(() => {
      markdownItInstanceRef.current.renderer.rules.fence = createFenceRule({
        highlighter,
        theme,
      })

      markdownItInstanceRef.current.renderer.rules.image = (
        tokens,
        idx,
        options,
        env,
        self,
      ) => {
        const token = tokens[idx]
        const localImageId = getLocalImageId(token.attrGet("src") ?? "")

        if (localImageId) {
          const source = localImageSources[localImageId]
          if (!source) {
            return '<span class="md-local-image-loading">图片加载中…</span>'
          }
          token.attrSet("src", source)
          token.attrJoin("class", "md-local-image")
        }

        const defaultImageRenderer = defaultImageRendererRef.current
        return defaultImageRenderer
          ? defaultImageRenderer(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options)
      }

      const { yaml: frontMatter, body } = parseFrontMatter(mdContent)
      return {
        yaml: frontMatter,
        html: markdownItInstanceRef.current.render(body),
      }
    }, [mdContent, highlighter, localImageSources, theme])

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
