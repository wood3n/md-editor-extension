import type { editor } from "monaco-editor"

// ─── helpers ────────────────────────────────────────────────────────────────

function range(
  line: number,
  startCol: number,
  endCol: number,
): {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
} {
  return {
    startLineNumber: line,
    startColumn: startCol,
    endLineNumber: line,
    endColumn: endCol,
  }
}

// ─── edit wrapper ───────────────────────────────────────────────────────────

let handlingOwnEdit = false

function editAndPosition(
  editor: editor.IStandaloneCodeEditor,
  editRange: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  },
  text: string,
  cursorLine: number,
  cursorColumn: number,
): void {
  handlingOwnEdit = true
  editor.pushUndoStop()
  editor.executeEdits("md-input", [
    { range: editRange, text, forceMoveMarkers: true },
  ])
  editor.pushUndoStop()
  handlingOwnEdit = false

  queueMicrotask(() => {
    if (!editor.getModel()) {
      return
    }
    editor.setPosition({ lineNumber: cursorLine, column: cursorColumn })
  })
}

// ─── backtick handler ───────────────────────────────────────────────────────

function handleBacktickAt(
  editor: editor.IStandaloneCodeEditor,
  model: editor.ITextModel,
  lineNumber: number,
  insCol: number,
  insertedLen: number,
): void {
  const cursorCol = insCol + insertedLen
  const line = model.getLineContent(lineNumber)

  // ── 1. Count consecutive backticks BEFORE cursor (for auto-close) ──
  let trailBt = 0
  for (let i = cursorCol - 2; i >= 0; i--) {
    if (line[i] === "`") {
      trailBt++
    } else {
      break
    }
  }
  if (trailBt === 0) {
    return
  }

  // ── 2. Find the FULL consecutive backtick group at cursor ──
  //   Include the character AT cursor (cursorCol-1 in 0-based) if it's also a
  //   backtick. This handles the auto-close scenario: after auto-close there
  //   are 2 backticks with cursor BETWEEN them, so typing a 3rd puts the
  //   cursor BEFORE the 3rd character, making trailBt = 2 not 3.
  let totalBt = trailBt
  for (let i = cursorCol - 1; i < line.length && line[i] === "`"; i++) {
    totalBt++
  }

  // ── 3. Text before the entire backtick group ──
  const startOfGroup = cursorCol - 1 - trailBt
  const beforeBt = line.slice(0, startOfGroup)
  const wasInCode = (beforeBt.match(/`/g) || []).length % 2 === 1

  // ── Fenced code block: ≥3 consecutive backticks at line start ──
  if (totalBt >= 3 && !wasInCode && /^\s*$/.test(beforeBt)) {
    // Replace the entire line (line start → end) with the code block template.
    // Using totalBt for the range ensures any auto-close leftovers are included.
    const endCol = startOfGroup + totalBt + 1 // 1-based: after last backtick
    const opRange = range(lineNumber, 1, endCol)
    editAndPosition(editor, opRange, "```js\n\n```", lineNumber + 1, 1)
    return
  }

  // ── Auto-close a single backtick ──
  if (trailBt === 1 && !wasInCode) {
    const opRange = range(lineNumber, cursorCol - 1, cursorCol)
    editAndPosition(editor, opRange, "``", lineNumber, cursorCol)
    return
  }
}

// ─── image / bracket handler ────────────────────────────────────────────────

function handleBracketAt(
  editor: editor.IStandaloneCodeEditor,
  model: editor.ITextModel,
  lineNumber: number,
  insCol: number,
  insertedLen: number,
): void {
  if (insCol <= 1) {
    return
  }

  const line = model.getLineContent(lineNumber)

  if (line[insCol - 2] !== "!" || line[insCol - 1] !== "[") {
    return
  }

  const endCol = insCol + insertedLen
  const opRange = range(lineNumber, insCol - 1, endCol)
  editAndPosition(editor, opRange, "![]()", lineNumber, insCol + 1)
}

// ─── public API ─────────────────────────────────────────────────────────────

const BACKTICK = "`"

export function setupMarkdownInputHandler(
  editor: editor.IStandaloneCodeEditor,
): void {
  editor.onDidChangeModelContent((e) => {
    if (handlingOwnEdit) {
      return
    }

    const change = e.changes[0]
    if (!change) {
      return
    }

    const model = editor.getModel()
    if (!model) {
      return
    }

    const text = change.text
    const insCol = change.range.startColumn
    const lineNumber = change.range.startLineNumber
    const len = text.length

    // backtick
    if (len >= 1 && text[0] === BACKTICK) {
      handleBacktickAt(editor, model, lineNumber, insCol, len)
      return
    }

    // bracket
    if (text === "[" || text === "[]" || text === "![") {
      handleBracketAt(editor, model, lineNumber, insCol, len)
      return
    }
  })
}
