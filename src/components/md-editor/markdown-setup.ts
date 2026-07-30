import type { editor } from "monaco-editor"

import { setupMarkdownInputHandler } from "./markdown-input-handler"

/**
 * Activate all Markdown editing enhancements for the given editor.
 * Call once in `onMount` after the editor is created.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupMarkdownEditor(editor: editor.IStandaloneCodeEditor, _monaco: any): void {
  // Input interception for auto-pairing / snippet expansion
  setupMarkdownInputHandler(editor)
}
