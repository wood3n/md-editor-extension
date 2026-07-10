import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ListTree, X } from "lucide-react";
import { cn } from "./lib/utils";
import { DEFAULT_MARKDOWN } from "./lib/constants";
import { Toolbar } from "./components/Toolbar";
import { EditorPanel } from "./components/EditorPanel";
import { Toc } from "./components/Toc";
import { Sidebar } from "./components/Sidebar";
import { SaveDialog } from "./components/SaveDialog";
import { RenameDialog } from "./components/RenameDialog";
import { Toast } from "./components/Toast";
import { useCurrentTabUrl } from "./hooks/useCurrentTabUrl";
import { saveDoc, updateDoc, SavedDoc } from "./lib/doc-store";

export default function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [showToc, setShowToc] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [activeDoc, setActiveDoc] = useState<SavedDoc | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("md-editor-theme");
    if (saved !== null) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("md-editor-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  const { mdUrl, loading, loadedContent, error } = useCurrentTabUrl();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const getMarkdownRef = useRef<(() => string) | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Sync initial markdown with loaded content
  useEffect(() => {
    if (loadedContent !== null && markdown === DEFAULT_MARKDOWN && !activeDoc) {
      setMarkdown(loadedContent);
    }
  }, [loadedContent]);

  const editorKey = useRef(0);
  const lastLoadedRef = useRef<string | null>(null);
  const displayContent = useMemo(() => {
    if (loadedContent !== null && loadedContent !== lastLoadedRef.current) {
      lastLoadedRef.current = loadedContent;
      editorKey.current += 1;
      return loadedContent;
    }
    return markdown;
  }, [loadedContent, markdown]);

  // ── Save ──
  const handleSaveClick = useCallback(async () => {
    const content = getMarkdownRef.current?.() || markdown;

    if (activeDoc) {
      const updated = await updateDoc(activeDoc.id, { content });
      if (updated) {
        setActiveDoc(updated);
        setSaved(true);
        setSaveCount((c) => c + 1);
        setTimeout(() => setSaved(false), 2000);
      }
    } else {
      setShowSaveDialog(true);
    }
  }, [activeDoc, markdown]);

  const handleSaveConfirm = useCallback(
    async (title: string) => {
      const content = getMarkdownRef.current?.() || markdown;
      const doc = await saveDoc(title, content);
      setActiveDoc(doc);
      setSaved(true);
      setSaveCount((c) => c + 1);
      setTimeout(() => setSaved(false), 2000);
    },
    [markdown]
  );

  // ── Keyboard shortcut: Cmd+S / Ctrl+S ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveClick]);

  // ── Load doc from sidebar ──
  const handleSelectDoc = useCallback((doc: SavedDoc) => {
    setActiveDoc(doc);
    setMarkdown(doc.content);
    lastLoadedRef.current = doc.content;
    editorKey.current += 1;
  }, []);

  // ── New document ──
  const handleNewDoc = useCallback(() => {
    setActiveDoc(null);
    setMarkdown(DEFAULT_MARKDOWN);
    editorKey.current += 1;
    lastLoadedRef.current = null;
  }, []);

  // ── Rename document ──
  const handleRename = useCallback(async (title: string) => {
    if (!activeDoc) return;
    const updated = await updateDoc(activeDoc.id, { title });
    if (updated) {
      setActiveDoc(updated);
      setSaveCount((c) => c + 1);
    }
  }, [activeDoc]);

  // ── Export ──
  const handleExportMd = useCallback(() => {
    const md = getMarkdownRef.current?.() || markdown;
    const name = (activeDoc?.title || "document").replace(/[<>:"/\\|?*]/g, "_");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.md`;
    a.click();
  }, [markdown, activeDoc]);

  const handleExportPdf = useCallback(async () => {
    const { marked } = await import("marked");
    const md = getMarkdownRef.current?.() || markdown;
    const html = await marked.parse(md || "");

    const doc = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>MD Editor Export</title>
<style>
  @media print { @page { margin: 1.5cm; } }
  body { font: 13px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:#1a1a1a; padding:2cm; max-width:800px; margin:0 auto; }
  h1 { font-size:1.7em; } h2 { font-size:1.4em; }
  pre { background:#f5f5f5; border:1px solid #ddd; border-radius:4px; padding:10px; white-space:pre-wrap; font-size:.85em; }
  code { background:#f0f0f0; padding:1px 4px; border-radius:3px; }
  pre code { background:none; padding:0; }
  blockquote { border-left:3px solid #ddd; margin:.8em 0; padding:.4em .8em; color:#555; }
  table { border-collapse:collapse; width:100%; } th,td { border:1px solid #ddd; padding:6px 10px; } th { background:#f5f5f5; }
</style></head><body>${html}</body></html>`;

    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "document.html";
    a.click();
  }, [markdown]);

  const activeDateStr = activeDoc
    ? new Date(activeDoc.updatedAt).toLocaleDateString()
    : "";

  return (
    <div className="flex flex-col h-screen bg-background">
      <Toolbar
        onExportPdf={handleExportPdf}
        onExportMd={handleExportMd}
        dark={dark}
        onToggleDark={toggleDark}
        onSave={handleSaveClick}
        onNewDoc={handleNewDoc}
        onEditDoc={() => setShowRenameDialog(true)}
        sidebarOpen={showSidebar}
        onToggleSidebar={() => setShowSidebar((v) => !v)}
        docTitle={activeDoc?.title}
        docTime={activeDoc ? activeDateStr : undefined}
      />

      {/* Remote URL status bar */}
      {mdUrl && !activeDoc && (
        <div className="no-print flex items-center gap-2 px-4 py-1.5 text-xs bg-muted dark:bg-blue-950 border-b">
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">加载中：{mdUrl}</span>
            </>
          ) : error ? (
            <>
              <span className="text-red-500">✕</span>
              <span className="text-red-600">{error}</span>
            </>
          ) : (
            <>
              <span className="text-green-500">✓</span>
              <span className="text-muted-foreground">已加载：{mdUrl}</span>
            </>
          )}
        </div>
      )}

      {/* Body: sidebar + editor */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          open={showSidebar}
          activeDocId={activeDoc?.id ?? null}
          onSelectDoc={handleSelectDoc}
          onDeleteDoc={(id) => {
            if (activeDoc?.id === id) {
              setActiveDoc(null);
            }
          }}
          refreshKey={saveCount}
        />

        <div className="flex-1 relative overflow-hidden">
          <div ref={editorContainerRef} className="h-full">
            <EditorPanel
              key={editorKey.current}
              defaultValue={displayContent}
              onChange={setMarkdown}
              getMarkdownRef={getMarkdownRef}
              dark={dark}
            />
          </div>

          {/* 悬浮 TOC 切换按钮 — 与 TOAST UI Editor 工具栏按钮垂直居中对齐 */}
          <button
            onClick={() => setShowToc((v) => !v)}
            style={{ top: "7px", right: "16px" }}
            className={cn(
              "absolute z-20 flex items-center justify-center w-8 h-8 rounded-md border bg-background hover:bg-accent transition-colors shadow-sm",
              showToc && "bg-accent"
            )}
            title="切换目录"
          >
            {showToc ? <X className="w-4 h-4" /> : <ListTree className="w-4 h-4" />}
          </button>

          {showToc && (
            <div className="absolute top-12 w-56 max-h-[60%] overflow-auto bg-background/95 backdrop-blur border rounded-lg shadow-lg z-10 mt-1" style={{ right: "16px" }}>
              <Toc containerRef={editorContainerRef} />
            </div>
          )}
        </div>
      </div>

      {/* Save dialog */}
      <SaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveConfirm}
      />

      <RenameDialog
        open={showRenameDialog}
        currentTitle={activeDoc?.title ?? ""}
        onClose={() => setShowRenameDialog(false)}
        onSave={handleRename}
      />

      <Toast
        message="已保存"
        show={saved}
        onDone={() => setSaved(false)}
      />
    </div>
  );
}
