import type { editor } from "monaco-editor/editor/editor.api.js"

export function getSelection(editor: editor.IStandaloneCodeEditor): string {
  const selection = editor.getSelection()
  if (!selection) {
    return ""
  }
  const model = editor.getModel()
  if (!model) {
    return ""
  }
  return model.getValueInRange(selection)
}

export function insertAtCursor(
  editor: editor.IStandaloneCodeEditor,
  before: string,
  after = "",
) {
  const selection = editor.getSelection()
  if (!selection) {
    return
  }
  const model = editor.getModel()
  if (!model) {
    return
  }

  const selected = model.getValueInRange(selection)
  const replacement = before + selected + after

  editor.executeEdits("toolbar", [{ range: selection, text: replacement }])

  // Set cursor position after insertion
  if (selection.isEmpty()) {
    const p = selection.getStartPosition()
    editor.setPosition({
      lineNumber: p.lineNumber,
      column: p.column + before.length,
    })
  } else {
    // Select the newly inserted text (before + original selection + after)
    const start = selection.getStartPosition()
    editor.setSelection({
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: start.lineNumber,
      endColumn: start.column + replacement.length,
    })
  }
  editor.focus()
}

export function prefixLines(
  editor: editor.IStandaloneCodeEditor,
  prefix: string,
) {
  const selection = editor.getSelection()
  if (!selection) {
    return
  }
  const model = editor.getModel()
  if (!model) {
    return
  }

  const startLine = selection.startLineNumber
  const endLine = selection.endLineNumber

  const lines: string[] = []
  for (let i = startLine; i <= endLine; i++) {
    lines.push(prefix + model.getLineContent(i))
  }

  editor.executeEdits("toolbar", [
    {
      range: {
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: endLine,
        endColumn: model.getLineMaxColumn(endLine),
      },
      text: lines.join("\n"),
    },
  ])
  editor.focus()
}
