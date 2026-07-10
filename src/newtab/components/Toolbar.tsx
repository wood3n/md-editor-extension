import { useState, useRef, useEffect } from "react";
import { Save, Plus, FileDown, MoreHorizontal, Sun, Moon, PanelLeftOpen, PanelLeftClose, Pencil } from "lucide-react";
import { cn } from "../lib/utils";

interface ToolbarProps {
  onExportPdf: () => void;
  onExportMd: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onSave: () => void;
  onNewDoc: () => void;
  onEditDoc?: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  docTitle?: string;
  docTime?: string;
  className?: string;
}

export function Toolbar({
  onExportPdf,
  onExportMd,
  dark,
  onToggleDark,
  onSave,
  onNewDoc,
  onEditDoc,
  sidebarOpen,
  onToggleSidebar,
  docTitle,
  docTime,
  className,
}: ToolbarProps) {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMore) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMore]);

  return (
    <div
      className={cn(
        "no-print flex items-center h-12 px-4 border-b bg-background shrink-0 gap-2",
        className
      )}
    >
      {/* 侧边栏开关 — 左上角 */}
      <button
        onClick={onToggleSidebar}
        className={cn(
          "p-2 rounded-md border hover:bg-accent transition-colors",
          sidebarOpen && "bg-accent"
        )}
        title={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
      >
        {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
      </button>

      {/* 文档标题和日期 — 侧边栏按钮右侧 */}
      {docTitle && (
        <div className="group flex items-center gap-1 ml-1 min-w-0">
          <span className="text-sm font-medium truncate">{docTitle}</span>
          {docTime && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              · {docTime}
            </span>
          )}
          <button
            onClick={onEditDoc}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all"
            title="编辑标题"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* 右上角按钮组 */}

      {/* 新建 */}
      <button
        onClick={onNewDoc}
        className="p-2 rounded-md border hover:bg-accent transition-colors"
        title="新建文档"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* 保存 */}
      <button
        onClick={onSave}
        className="p-2 rounded-md border hover:bg-accent transition-colors"
        title="保存到本地 (⌘S)"
      >
        <Save className="w-4 h-4" />
      </button>

      {/* 导出按钮组：MD + More */}
      <div className="flex">
        <button
          onClick={onExportMd}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-l-md border border-r-0 hover:bg-accent transition-colors"
          title="下载 Markdown"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">MD</span>
        </button>

        <div ref={moreRef} className="relative">
          <button
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center px-2 py-2 text-xs rounded-r-md border hover:bg-accent transition-colors"
            title="更多"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMore && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-background border rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => { onExportPdf(); setShowMore(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
              >
                <FileDown className="w-3.5 h-3.5" />
                导出 HTML
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 深色/浅色切换 */}
      <button
        onClick={onToggleDark}
        className="flex items-center justify-center p-2 rounded-md border hover:bg-accent transition-colors"
        title={dark ? "切换浅色模式" : "切换深色模式"}
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
}
