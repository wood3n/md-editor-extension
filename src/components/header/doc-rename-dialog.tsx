import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useDoc } from "@/context/doc"

import { toast } from "../ui/toast"

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocRenameDialog({ open, onOpenChange }: RenameDialogProps) {
  const [title, setTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const currentTitle = useDoc((state) => state.title)

  useEffect(() => {
    if (open) {
      setTitle(currentTitle)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [open, currentTitle])

  const handleSave = async () => {
    await useDoc.getState().updateTitle(title)

    onOpenChange(false)
    toast.add({
      type: "success",
      title: "保存成功",
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    }
    if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>修改文档标题</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入文档标题…"
            onKeyDown={handleKeyDown}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            size="sm"
            disabled={currentTitle === title}
            onClick={handleSave}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
