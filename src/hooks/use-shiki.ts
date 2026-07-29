import { useEffect, useRef, useState } from "react"
import {
  createHighlighter,
  createJavaScriptRegexEngine,
  type Highlighter,
} from "shiki"

import { MarkdownCodeLanguages, ThemeList } from "./../constants"

const jsEngine = createJavaScriptRegexEngine({ forgiving: true })

export function useShikiHighlighter() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const [loading, setLoading] = useState(true)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) {
      return
    }
    initRef.current = true

    async function init() {
      try {
        const hl = await createHighlighter({
          langs: MarkdownCodeLanguages,
          themes: ThemeList.map((t) => t.id),
          engine: jsEngine,
        })
        setHighlighter(hl)
      } catch (error) {
        console.error("Shiki init error:", error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return { highlighter, loading }
}
