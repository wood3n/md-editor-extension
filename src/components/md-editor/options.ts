import { type editor } from "monaco-editor"

export const MonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  fontFamily:
    '"Cascadia Code", "Fira Code", "JetBrains Mono", "Menlo", monospace',
  fontSize: 14,
  lineHeight: 24,
  letterSpacing: 0.3,
  fontLigatures: true,
  wordWrap: "on",
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  renderLineHighlight: "gutter",
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  minimap: { enabled: false },
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 0,
    alwaysConsumeMouseWheel: false,
    useShadows: false,
  },
  guides: {
    indentation: false,
  },
  bracketPairColorization: { enabled: false },
  occurrencesHighlight: "off",
  selectionHighlight: false,
  renderWhitespace: "none",
  glyphMargin: false,
  folding: false,
  contextmenu: false,
  unicodeHighlight: {
    ambiguousCharacters: false,
    invisibleCharacters: false,
    nonBasicASCII: false,
  },
}
