import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
}

export function SaveDialog({ open, onClose, onSave }: SaveDialogProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSave = () => {
    onSave(title.trim() || "未命名");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>保存文档</DialogTitle>
        </DialogHeader>

        <div>
          <label className="block text-base text-muted-foreground mb-2">文档标题</label>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入文档标题…"
            onKeyDown={handleKeyDown}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
