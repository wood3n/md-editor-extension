import ReactMonacoEditor, {
  type BeforeMount,
  type OnMount,
} from "@monaco-editor/react"

import { useDoc } from "@/context/doc"
import { useTheme } from "@/hooks/use-theme"

import { MonacoOptions } from "./options"

interface Props {
  beforeMount?: BeforeMount
  onMount: OnMount
  onChange?: (value?: string) => void
}

export function MDEditor({ beforeMount, onMount, onChange }: Props) {
  const content = useDoc((state) => state.content)
  const { theme } = useTheme()

  return (
    <div className="h-full pl-2">
      <ReactMonacoEditor
        height="100%"
        language="markdown"
        value={content}
        beforeMount={beforeMount}
        onMount={onMount}
        theme={theme}
        loading={
          <div className="flex h-full w-full items-center justify-center font-mono text-sm">
            正在加载编辑器...
          </div>
        }
        onChange={(v) => {
          useDoc.setState({ content: v })
          onChange?.(v)
        }}
        options={MonacoOptions}
      />
    </div>
  )
}
