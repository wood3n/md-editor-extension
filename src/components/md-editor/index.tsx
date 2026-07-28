import ReactMonacoEditor, { type OnMount } from "@monaco-editor/react"

import { useDoc } from "@/context/doc"

import { MonacoOptions } from "./options"

interface Props {
  onMount: OnMount
}

export function MDEditor({ onMount }: Props) {
  const content = useDoc((state) => state.content)

  return (
    <div className="h-full pl-2">
      <ReactMonacoEditor
        height="100%"
        language="markdown"
        value={content}
        onMount={onMount}
        loading={
          <div className="flex h-full w-full items-center justify-center font-mono text-sm">
            正在加载编辑器...
          </div>
        }
        onChange={(v) => useDoc.setState({ content: v })}
        options={MonacoOptions}
      />
    </div>
  )
}
