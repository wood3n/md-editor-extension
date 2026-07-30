import { loader, type BeforeMount, type OnMount } from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import { useCallback, useEffect, useRef } from "react"

import { Header } from "@/components/header"
import { MDPreview, type MDPreviewHandle } from "@/components/md-preview"
import { MarkdownToolbar } from "@/components/md-toolbar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Spinner } from "@/components/ui/spinner"
import { useShikiHighlighter } from "@/hooks/use-shiki"
import { setupShikiMonaco } from "@/lib/setup-shiki-monaco"
import { setupMarkdownEditor } from "@/components/md-editor/markdown-setup"

import { MDEditor } from "./components/md-editor"
import { Toaster } from "./components/ui/toast"
import { useAutoSave } from "./hooks/use-auto-save"
import { useTheme } from "./hooks/use-theme"

window.MonacoEnvironment = {
  getWorker() {
    return new Worker(
      new URL("monaco-editor/editor/editor.worker", import.meta.url),
      { type: "module" },
    )
  },
}

loader.config({ monaco })

let shikiRegistered = false

export function App() {
  const { theme } = useTheme()
  const { saveNow, onUserEdit, saveCount } = useAutoSave()

  const { highlighter, loading } = useShikiHighlighter()
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const previewRef = useRef<MDPreviewHandle>(null)
  const syncingRef = useRef(false)

  // Register Shiki themes + token providers BEFORE editor creation,
  // so the initial model renders with Shiki tokens from the start
  const handleBeforeMount: BeforeMount = useCallback(
    (monacoInstance) => {
      monacoInstance.languages.register({ id: "markdown" })
      if (highlighter && !shikiRegistered) {
        shikiRegistered = true
        setupShikiMonaco(highlighter, monacoInstance)
      }
    },
    [highlighter],
  )

  const handleMount: OnMount = useCallback((editor, monacoInstance) => {
    editor.focus()
    setupMarkdownEditor(editor, monacoInstance)
    editorRef.current = editor
    monacoRef.current = monacoInstance

    // Scroll sync: Monaco -> Preview
    editor.onDidScrollChange(() => {
      if (syncingRef.current || !previewRef.current?.scrollContainer) {
        return
      }
      syncingRef.current = true

      const previewEl = previewRef.current.scrollContainer
      const editorInfo = editor.getLayoutInfo()
      const editorScrollable = editor.getScrollHeight() - editorInfo.height
      const editorRatio =
        editorScrollable > 0 ? editor.getScrollTop() / editorScrollable : 0
      const previewScrollable = previewEl.scrollHeight - previewEl.clientHeight
      if (previewScrollable > 0) {
        previewEl.scrollTop = editorRatio * previewScrollable
      }

      syncingRef.current = false
    })
  }, [])

  // Sync Preview scroll -> Monaco scroll
  const handlePreviewScroll = useCallback(() => {
    const editor = editorRef.current
    const previewEl = previewRef.current?.scrollContainer
    if (syncingRef.current || !editor || !previewEl) {
      return
    }
    syncingRef.current = true

    const srcRange = previewEl.scrollHeight - previewEl.clientHeight
    const srcRatio = srcRange > 0 ? previewEl.scrollTop / srcRange : 0

    const tgtRange = editor.getScrollHeight() - editor.getLayoutInfo().height
    if (tgtRange > 0) {
      editor.setScrollPosition({ scrollTop: srcRatio * tgtRange })
    }

    syncingRef.current = false
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <>
      <main className="flex h-screen w-screen flex-col bg-background text-foreground">
        <Header saveCount={saveCount} />
        <MarkdownToolbar editorRef={editorRef} previewRef={previewRef} />
        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Spinner className="size-10" />
          </div>
        ) : (
          <ResizablePanelGroup
            orientation="horizontal"
            className="flex min-h-0 flex-1"
          >
            <ResizablePanel defaultSize={50} minSize={25}>
              <MDEditor
                beforeMount={handleBeforeMount}
                onMount={handleMount}
                onChange={onUserEdit}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <MDPreview
                ref={previewRef}
                highlighter={highlighter}
                onScroll={handlePreviewScroll}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>
      <Toaster />
    </>
  )
}

export default App
