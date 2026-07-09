import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

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

  if (!open) return null;

  const now = new Date();
  const timeStr = now.toLocaleString();

  const handleSave = () => {
    onSave(title.trim() || "未命名");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="bg-background border rounded-xl shadow-2xl w-96 p-6"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">保存文档</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block text-xs text-muted-foreground mb-1.5">
          文档标题
        </label>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入文档标题…"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={handleKeyDown}
        />

        <p className="text-xs text-muted-foreground mt-3">
          保存时间：{timeStr}
        </p>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-md border hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
