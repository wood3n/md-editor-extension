import { useState, useCallback, useEffect, startTransition } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster, toast } from "sonner";
import { DEFAULT_MARKDOWN } from "./lib/constants";
import { Toolbar } from "./components/Toolbar";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { Sidebar } from "./components/Sidebar";
import { SaveDialog } from "./components/SaveDialog";
import { RenameDialog } from "./components/RenameDialog";
import { useCurrentTabUrl } from "./hooks/useCurrentTabUrl";
import { saveDoc, updateDoc, type SavedDoc } from "./lib/doc-store";
import { renderMarkdown, getOrCreateRenderer } from "./lib/markdown";
import { THEME_PRESETS, type ThemePreset } from "@/newtab/lib/themes";

const DEFAULT_THEME = "github-light";

export default function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [showToc, setShowToc] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [activeDoc, setActiveDoc] = useState<SavedDoc | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  // Unified theme state
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem("md-current-theme") || DEFAULT_THEME;
  });

  const currentPreset = THEME_PRESETS.find((p) => p.id === currentThemeId) || THEME_PRESETS[0];
  const dark = currentPreset.dark;
  const previewTheme = currentPreset.previewTheme;
  const codeTheme = currentPreset.codeTheme;
  const editorTheme = currentPreset.editorTheme;
  const chromeBg = currentPreset.chromeBg;
  const chromeBorder = currentPreset.chromeBorder;
  const chromeHover = currentPreset.chromeHover;
  const chromeActive = currentPreset.chromeActive;

  const handleThemeChange = useCallback((preset: ThemePreset) => {
    startTransition(() => {
      setCurrentThemeId(preset.id);
    });
    localStorage.setItem("md-current-theme", preset.id);
  }, []);

  // Apply dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const { mdUrl, loading, loadedContent, error } = useCurrentTabUrl();

  // Sync initial markdown with loaded content
  const lastLoadedRef = useState<{ current: string | null }>({ current: null })[0];
  useEffect(() => {
    if (loadedContent !== null && markdown === DEFAULT_MARKDOWN && !activeDoc) {
      setMarkdown(loadedContent);
      lastLoadedRef.current = loadedContent;
    }
  }, [loadedContent]);

  // ── Save ──
  const handleSaveClick = useCallback(async () => {
    const content = markdown;
    if (activeDoc) {
      const updated = await updateDoc(activeDoc.id, { content });
      if (updated) {
        setActiveDoc(updated);
        setSaveCount((c) => c + 1);
        toast.success("已保存");
      }
    } else {
      setShowSaveDialog(true);
    }
  }, [activeDoc, markdown]);

  const handleSaveConfirm = useCallback(
    async (title: string) => {
      const content = markdown;
      const doc = await saveDoc(title, content);
      setActiveDoc(doc);
      setSaveCount((c) => c + 1);
      toast.success("已保存");
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
  }, []);

  // ── New document ──
  const handleNewDoc = useCallback(() => {
    setActiveDoc(null);
    setMarkdown(DEFAULT_MARKDOWN);
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
    const md = markdown;
    const name = (activeDoc?.title || "document").replace(/[<>:"/\\|?*]/g, "_");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.md`;
    a.click();
  }, [markdown, activeDoc]);

  const handleExportPdf = useCallback(async () => {
    const md = await getOrCreateRenderer(codeTheme);
    const html = renderMarkdown(md, markdown || "");
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
  }, [markdown, codeTheme]);

  // Apply chrome vars to <html> so portal-rendered elements (dropdowns, dialogs) inherit them
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--chrome-bg", chromeBg);
    html.style.setProperty("--chrome-border", chromeBorder);
    html.style.setProperty("--chrome-hover", chromeHover);
    html.style.setProperty("--chrome-active", chromeActive);
    html.style.setProperty("--background", chromeBg);
    html.style.setProperty("--muted", chromeHover);
    html.style.setProperty("--accent", chromeActive);
    html.style.setProperty("--popover", chromeBg);
    html.style.setProperty("--card", chromeBg);
    html.style.setProperty("--border", chromeBorder);
    html.style.setProperty("--input", chromeBorder);
  }, [chromeBg, chromeBorder, chromeHover, chromeActive]);

  const activeDateStr = activeDoc
    ? new Date(activeDoc.updatedAt).toLocaleDateString()
    : "";

  return (
    <TooltipProvider delay={300}>
      <div className="flex flex-col h-screen bg-background">
        <Toolbar
          onExportPdf={handleExportPdf}
          onExportMd={handleExportMd}
          onSave={handleSaveClick}
          onNewDoc={handleNewDoc}
          onEditDoc={() => setShowRenameDialog(true)}
          sidebarOpen={showSidebar}
          onToggleSidebar={() => setShowSidebar((v) => !v)}
          docTitle={activeDoc?.title}
          docTime={activeDoc ? activeDateStr : undefined}
          currentTheme={currentThemeId}
          onThemeChange={handleThemeChange}
        />

        {/* Remote URL status bar */}
        {mdUrl && !activeDoc && (
            <div
              className="flex items-center gap-2 px-4 py-1.5 text-base border-b"
              style={{ backgroundColor: "var(--chrome-bg)", borderColor: "var(--chrome-border)" }}
            >
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
        <div className="flex-1 flex overflow-hidden">
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

          <div className="flex-1 overflow-hidden relative">
            <MarkdownEditor
              value={markdown}
              onChange={setMarkdown}
              showToc={showToc}
              onToggleToc={() => setShowToc((v) => !v)}
              previewTheme={previewTheme}
              codeTheme={codeTheme}
              editorTheme={editorTheme}
              previewBg={chromeBg}
            />
          </div>
        </div>

        {/* Dialogs */}
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

        <Toaster position="top-center" duration={2000} />
      </div>
    </TooltipProvider>
  );
}
