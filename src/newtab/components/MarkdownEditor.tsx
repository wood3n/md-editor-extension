import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { monokai } from "@uiw/codemirror-theme-monokai";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { nord } from "@uiw/codemirror-theme-nord";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { autocompletion } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { EditorView as CMView } from "@codemirror/view";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { MarkdownPreview } from "./MarkdownPreview";
import { Toc } from "./Toc";
import { getOrCreateRenderer, renderMarkdown } from "@/newtab/lib/markdown";
import { cn } from "@/newtab/lib/utils";
import type MarkdownIt from "markdown-it";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  showToc: boolean;
  onToggleToc: () => void;
  previewTheme: string;
  codeTheme: string;
  editorTheme: string;
  previewBg: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  showToc,
  onToggleToc,
  previewTheme,
  codeTheme,
  editorTheme,
  previewBg,
  className,
}: MarkdownEditorProps) {
  const [renderedHtml, setRenderedHtml] = useState("");
  const cmViewRef = useRef<EditorView | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const mdRef = useRef<MarkdownIt | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Setup markdown-it + shiki when codeTheme changes
  useEffect(() => {
    let cancelled = false;
    getOrCreateRenderer(codeTheme).then((md) => {
      if (cancelled) return;
      mdRef.current = md;
      setRenderedHtml(renderMarkdown(md, valueRef.current));
    });
    return () => { cancelled = true; };
  }, [codeTheme]);

  // Sync render on value change
  useEffect(() => {
    if (!mdRef.current) return;
    setRenderedHtml(renderMarkdown(mdRef.current, value));
  }, [value]);
  const extensions = useMemo<Extension[]>(() => {
    return [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      autocompletion(),
      CMView.lineWrapping,
    ];
  }, []);

  // CodeMirror theme
  const cmTheme = useMemo<Extension | "light" | "dark">(() => {
    const themeMap: Record<string, Extension> = {
      "github-light": githubLight,
      "github-dark": githubDark,
      "vscode-dark": vscodeDark,
      "one-dark": oneDark,
      monokai,
      dracula,
      nord,
      sublime,
    };
    return themeMap[editorTheme] ?? "light";
  }, [editorTheme]);

  // ── Scroll Sync ──
  const handleEditorScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;

    const cmScroll = cmViewRef.current?.scrollDOM;
    const preview = previewContainerRef.current;
    if (!cmScroll || !preview) {
      syncing.current = false;
      return;
    }

    const maxScroll = cmScroll.scrollHeight - cmScroll.clientHeight;
    if (maxScroll <= 0) { syncing.current = false; return; }

    const pct = cmScroll.scrollTop / maxScroll;
    preview.scrollTop = pct * (preview.scrollHeight - preview.clientHeight);

    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;

    const cmScroll = cmViewRef.current?.scrollDOM;
    const preview = previewContainerRef.current;
    if (!cmScroll || !preview) {
      syncing.current = false;
      return;
    }

    const maxScroll = preview.scrollHeight - preview.clientHeight;
    if (maxScroll <= 0) { syncing.current = false; return; }

    const pct = preview.scrollTop / maxScroll;
    cmScroll.scrollTop = pct * (cmScroll.scrollHeight - cmScroll.clientHeight);

    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  // Attach CM scroll listener after view is created
  const handleCreateEditor = useCallback((view: EditorView) => {
    cmViewRef.current = view;
    view.scrollDOM.addEventListener("scroll", handleEditorScroll, { passive: true });
  }, [handleEditorScroll]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <MarkdownToolbar
        cmViewRef={cmViewRef}
        showToc={showToc}
        onToggleToc={onToggleToc}
      />

      {/* Split panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane (left 50%) */}
        <div className="w-1/2 border-r flex flex-col min-h-0">
          <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            onCreateEditor={handleCreateEditor}
            theme={cmTheme}
            className="flex-1 min-h-0"
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
          />
        </div>

        {/* Preview pane (right 50%) */}
        <div className="w-1/2 relative">
          <MarkdownPreview
            html={renderedHtml}
            previewTheme={previewTheme}
            previewBg={previewBg}
            className="h-full"
            containerRef={previewContainerRef}
          />

          {/* TOC overlay */}
          {showToc && (
            <div
              className="absolute top-0 right-0 mt-2 mr-2 w-56 max-h-[60%] overflow-auto border rounded-lg shadow-lg z-10"
              style={{ backgroundColor: "var(--chrome-bg)", borderColor: "var(--chrome-border)" }}
            >
              <Toc containerRef={previewContainerRef} />
            </div>
          )}
        </div>

        {/* Preview scroll bridge */}
        <PreviewScrollBridge
          containerRef={previewContainerRef}
          onScroll={handlePreviewScroll}
        />
      </div>
    </div>
  );
}

function PreviewScrollBridge({
  containerRef,
  onScroll,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef, onScroll]);

  return null;
}
