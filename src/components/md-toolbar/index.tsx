import { Bold, Italic, Underline, Strikethrough, Quote, ListChecks, Table2, Image, Link, Code } from "lucide-react"
import type { editor } from "monaco-editor/editor/editor.api"
import { useCallback, type RefObject } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { MDPreviewHandle } from "@/components/md-preview"
import { HeaderSelect } from "./header-select"
import { TocButton } from "./toc"
import { getSelection, insertAtCursor, prefixLines } from "./tool"

interface MarkdownToolbarProps {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
  previewRef: RefObject<MDPreviewHandle | null>
}

export function MarkdownToolbar({ editorRef, previewRef }: MarkdownToolbarProps) {
  const getEditor = () => editorRef.current

  const handleHeading = useCallback((level: number) => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    const position = editor.getPosition()
    if (!position) {
      return
    }
    const prefix = `${"#".repeat(level)} `
    const needsNewline = position.column > 1
    const text = needsNewline ? `\n${prefix}` : prefix
    editor.executeEdits("toolbar", [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text,
      },
    ])
    const newLine = needsNewline ? position.lineNumber + 1 : position.lineNumber
    editor.setPosition({
      lineNumber: newLine,
      column: prefix.length + 1,
    })
    // DropdownMenu 关闭后会抢走焦点，需要延迟到下一个 tick 确保生效
    requestAnimationFrame(() => editor.focus())
  }, [])

  const handleBold = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    insertAtCursor(editor, "**", "**")
  }, [])

  const handleItalic = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    insertAtCursor(editor, "*", "*")
  }, [])

  const handleUnderline = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    insertAtCursor(editor, "<u>", "</u>")
  }, [])

  const handleStrikethrough = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    insertAtCursor(editor, "~~", "~~")
  }, [])

  const handleQuote = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    prefixLines(editor, "> ")
  }, [])

  const handleTask = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    const selection = editor.getSelection()
    if (!selection) {
      return
    }
    const lineNum = selection.startLineNumber
    const model = editor.getModel()
    if (!model) {
      return
    }

    editor.executeEdits("toolbar", [
      {
        range: {
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: 1,
        },
        text: "- [ ] ",
      },
    ])
    editor.setPosition({ lineNumber: lineNum, column: 7 })
    editor.focus()
  }, [])

  const handleTable = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    const table =
      "| 列 1 | 列 2 | 列 3 |\n| ---- | ---- | ---- |\n| 内容 | 内容 | 内容 |"
    insertAtCursor(editor, table)
  }, [])

  const handleImage = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    const selected = getSelection(editor)
    const alt = selected || "图片"
    insertAtCursor(editor, `![${alt}](`, ")")
  }, [])

  const handleLink = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    const selected = getSelection(editor)
    const text = selected || "链接文字"
    insertAtCursor(editor, `[${text}](`, ")")
  }, [])

  const handleCodeBlock = useCallback(() => {
    const editor = getEditor()
    if (!editor) {
      return
    }
    insertAtCursor(editor, "```\n", "\n```")
  }, [])

  return (
    <div className="flex items-center justify-between border-b px-3 py-1.5">
      <div className="flex items-center">
        {/* Heading dropdown */}
        <HeaderSelect onSelectHeading={handleHeading} />

        {/* Bold */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBold}
                type="button"
              >
                <Bold className="h-4 w-4" />
              </Button>
            }
          />

          <TooltipContent side="bottom">加粗 (Bold)</TooltipContent>
        </Tooltip>

        {/* Italic */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleItalic}
                type="button"
              >
                <Italic className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">斜体 (Italic)</TooltipContent>
        </Tooltip>

        {/* Underline */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleUnderline}
                type="button"
              >
                <Underline className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">下划线 (Underline)</TooltipContent>
        </Tooltip>

        {/* Strikethrough */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleStrikethrough}
                type="button"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">删除线 (Strikethrough)</TooltipContent>
        </Tooltip>

        {/* Blockquote */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleQuote}
                type="button"
              >
                <Quote className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">引用 (Blockquote)</TooltipContent>
        </Tooltip>

        {/* Task list */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleTask}
                type="button"
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">任务列表</TooltipContent>
        </Tooltip>

        {/* Table */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleTable}
                type="button"
              >
                <Table2 className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">插入表格</TooltipContent>
        </Tooltip>

        {/* Image */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleImage}
                type="button"
              >
                <Image className="h-4 w-4" />
              </Button>
            }
          />

          <TooltipContent side="bottom">插入图片</TooltipContent>
        </Tooltip>

        {/* Link */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleLink}
                type="button"
              >
                <Link className="h-4 w-4" />
              </Button>
            }
          />

          <TooltipContent side="bottom">插入链接</TooltipContent>
        </Tooltip>

        {/* Code block */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCodeBlock}
                type="button"
              >
                <Code className="h-4 w-4" />
              </Button>
            }
          />

          <TooltipContent side="bottom">代码块</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1">
        <TocButton previewRef={previewRef} />
      </div>
    </div>
  )
}
