import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { useDoc } from "@/context/doc"

interface SaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocSaveDialog({ open, onOpenChange }: SaveDialogProps) {
  const [title, setTitle] = useState("")
  const [error, setError] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle("")
      setError("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const validateTitle = () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError("标题不能为空")
      return false
    }

    if (trimmedTitle.length > 20) {
      setError("标题不能超过 20 个字符")
      return false
    }

    setError("")
    return true
  }

  const handleSave = async () => {
    if (!validateTitle()) {
      return
    }

    await useDoc.getState().saveDoc(title.trim())
    onOpenChange(false)
    toast.add({
      type: "success",
      title: "保存成功",
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    }
    if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>保存文档</DialogTitle>
        </DialogHeader>

        <Field>
          <FieldLabel>文档标题</FieldLabel>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) {
                setError("")
              }
            }}
            placeholder="请输入文档标题…"
            onKeyDown={handleKeyDown}
            maxLength={20}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button size="sm" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
