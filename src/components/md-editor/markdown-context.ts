import type { editor, Position } from "monaco-editor"

/**
 * Count consecutive backticks immediately before the cursor on the current line.
 */
export function countPrecedingBackticks(
  model: editor.ITextModel,
  position: Position,
): number {
  const line = model.getLineContent(position.lineNumber)
  const col = position.column - 1 // 0-based
  let count = 0
  for (let i = col - 1; i >= 0; i--) {
    if (line[i] === "`") {
      count++
    } else {
      break
    }
  }
  return count
}

/**
 * True if only whitespace (or nothing) exists between line start and cursor.
 */
export function isLineStart(
  model: editor.ITextModel,
  position: Position,
): boolean {
  const prefix = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1)
  return /^\s*$/.test(prefix)
}

/**
 * If the current line starts with ``` followed by an optional language token
 * (cursor right after ``` or ```lang), return the language text (may be "" for bare ```).
 * Otherwise return null.
 */
export function getCodeBlockLanguageToken(
  model: editor.ITextModel,
  position: Position,
): string | null {
  const prefix = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1)
  const m = prefix.match(/^```(\w*)$/)
  return m ? (m[1] ?? "") : null
}

/**
 * Count ALL backticks in the text prefix (before cursor), optionally excluding the
 * last character (useful when checking state BEFORE a just-typed character).
 */
function countBackticksInPrefix(
  line: string,
  column: number,
  excludeLastChar: boolean,
): number {
  // prefix = text before cursor (0-based column index)
  const prefix = line.slice(0, column - 1)
  const text =
    excludeLastChar && prefix.length > 0 ? prefix.slice(0, -1) : prefix
  let count = 0
  for (const ch of text) {
    if (ch === "`") {
      count++
    }
  }
  return count
}

/**
 * True if the cursor is inside an inline code span AFTER the current change
 * (counts ALL backticks in the prefix, not just consecutive ones).
 */
export function isInsideInlineCode(
  model: editor.ITextModel,
  position: Position,
): boolean {
  const line = model.getLineContent(position.lineNumber)
  return countBackticksInPrefix(line, position.column, false) % 2 === 1
}

/**
 * True if the cursor was inside an inline code span BEFORE the just-typed character
 * was inserted.  Useful in `onDidChangeModelContent` handlers where the model has
 * already been updated with the new character.
 */
export function wasInsideInlineCodeBeforeInsertion(
  model: editor.ITextModel,
  position: Position,
): boolean {
  const line = model.getLineContent(position.lineNumber)
  return countBackticksInPrefix(line, position.column, true) % 2 === 1
}

export interface CursorContext {
  /** True if only whitespace before cursor */
  lineStart: boolean
  /** Preceding backtick count (unbroken) */
  backtickCount: number
  /** True if inside inline code span */
  inInlineCode: boolean
  /** The language token after ```, or null if not at a code-fence line */
  codeBlockLang: string | null
}

export function getCursorContext(
  model: editor.ITextModel,
  position: Position,
): CursorContext {
  const bt = countPrecedingBackticks(model, position)
  return {
    lineStart: isLineStart(model, position),
    backtickCount: bt,
    inInlineCode: bt % 2 === 1,
    codeBlockLang: getCodeBlockLanguageToken(model, position),
  }
}
