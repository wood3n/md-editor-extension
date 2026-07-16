import { useCallback, type RefObject } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Quote,
  ListChecks,
  Table2,
  Image,
  Link,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ListTree,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/newtab/lib/utils";
import type { EditorView } from "@codemirror/view";

interface MarkdownToolbarProps {
  cmViewRef: RefObject<EditorView | null>;
  showToc: boolean;
  onToggleToc: () => void;
  className?: string;
}

// ── CodeMirror text manipulation helpers ──

function getSelection(view: EditorView) {
  const { from, to } = view.state.selection.main;
  return view.state.sliceDoc(from, to);
}

function insertAtCursor(view: EditorView, before: string, after: string = "") {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const replacement = before + selected + after;

  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: from === to
      ? { anchor: from + before.length }
      : { anchor: from, head: from + replacement.length },
  });
  view.focus();
}

function prefixLines(view: EditorView, prefix: string) {
  const { from, to } = view.state.selection.main;
  const doc = view.state.doc;

  // Find the line start
  const lineFrom = doc.lineAt(from);
  const lineTo = doc.lineAt(to);

  const lines: string[] = [];
  for (let i = lineFrom.number; i <= lineTo.number; i++) {
    lines.push(prefix + doc.line(i).text);
  }

  view.dispatch({
    changes: { from: lineFrom.from, to: lineTo.to, insert: lines.join("\n") },
  });
  view.focus();
}

const HEADING_ITEMS = [
  { level: 1, icon: Heading1, label: "标题 1", cls: "text-lg font-bold" },
  { level: 2, icon: Heading2, label: "标题 2", cls: "text-base font-semibold" },
  { level: 3, icon: Heading3, label: "标题 3", cls: "text-sm font-semibold" },
  { level: 4, icon: Heading4, label: "标题 4", cls: "text-sm font-medium" },
  { level: 5, icon: Heading5, label: "标题 5", cls: "text-xs font-medium" },
  { level: 6, icon: Heading6, label: "标题 6", cls: "text-xs text-muted-foreground" },
];

export function MarkdownToolbar({
  cmViewRef,
  showToc,
  onToggleToc,
  className,
}: MarkdownToolbarProps) {
  const getView = () => cmViewRef.current;

  const handleHeading = useCallback((level: number) => {
    const view = getView();
    if (!view) return;
    prefixLines(view, "#".repeat(level) + " ");
  }, []);

  const handleBold = useCallback(() => {
    const view = getView();
    if (!view) return;
    insertAtCursor(view, "**", "**");
  }, []);

  const handleItalic = useCallback(() => {
    const view = getView();
    if (!view) return;
    insertAtCursor(view, "*", "*");
  }, []);

  const handleUnderline = useCallback(() => {
    const view = getView();
    if (!view) return;
    insertAtCursor(view, "<u>", "</u>");
  }, []);

  const handleStrikethrough = useCallback(() => {
    const view = getView();
    if (!view) return;
    insertAtCursor(view, "~~", "~~");
  }, []);

  const handleQuote = useCallback(() => {
    const view = getView();
    if (!view) return;
    prefixLines(view, "> ");
  }, []);

  const handleTask = useCallback(() => {
    const view = getView();
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    view.dispatch({
      changes: { from: line.from, insert: "- [ ] " },
      selection: { anchor: line.from + 6 },
    });
    view.focus();
  }, []);

  const handleTable = useCallback(() => {
    const view = getView();
    if (!view) return;
    const table =
      "| 列 1 | 列 2 | 列 3 |\n| ---- | ---- | ---- |\n| 内容 | 内容 | 内容 |";
    insertAtCursor(view, table);
  }, []);

  const handleImage = useCallback(() => {
    const view = getView();
    if (!view) return;
    const selected = getSelection(view);
    const alt = selected || "图片";
    insertAtCursor(view, `![${alt}](`, ")");
  }, []);

  const handleLink = useCallback(() => {
    const view = getView();
    if (!view) return;
    const selected = getSelection(view);
    const text = selected || "链接文字";
    insertAtCursor(view, `[${text}](`, ")");
  }, []);

  const handleCodeBlock = useCallback(() => {
    const view = getView();
    if (!view) return;
    insertAtCursor(view, "```\n", "\n```");
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 px-2 py-1.5 border-b shrink-0",
        className
      )}
      style={{ backgroundColor: "var(--chrome-bg)", borderColor: "var(--chrome-border)" }}
    >
      {/* Heading dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
                <Heading1 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">标题格式</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start">
          {HEADING_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.level}
              onClick={() => handleHeading(item.level)}
              className={item.cls}
            >
              <item.icon className="h-4 w-4 mr-2 shrink-0" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bold */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBold} type="button">
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">加粗 (Bold)</TooltipContent>
      </Tooltip>

      {/* Italic */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleItalic} type="button">
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">斜体 (Italic)</TooltipContent>
      </Tooltip>

      {/* Underline */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUnderline} type="button">
            <Underline className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">下划线 (Underline)</TooltipContent>
      </Tooltip>

      {/* Strikethrough */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStrikethrough} type="button">
            <Strikethrough className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">删除线 (Strikethrough)</TooltipContent>
      </Tooltip>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Blockquote */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleQuote} type="button">
            <Quote className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">引用 (Blockquote)</TooltipContent>
      </Tooltip>

      {/* Task list */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleTask} type="button">
            <ListChecks className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">任务列表</TooltipContent>
      </Tooltip>

      {/* Table */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleTable} type="button">
            <Table2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">插入表格</TooltipContent>
      </Tooltip>

      {/* Image */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImage} type="button">
            <Image className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">插入图片</TooltipContent>
      </Tooltip>

      {/* Link */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLink} type="button">
            <Link className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">插入链接</TooltipContent>
      </Tooltip>

      {/* Code block */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCodeBlock} type="button">
            <Code className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">代码块</TooltipContent>
      </Tooltip>

      {/* Spacer — push TOC to the right */}
      <div className="flex-1" />

      {/* TOC toggle */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleToc}
            type="button"
          >
            {showToc ? <X className="h-4 w-4" /> : <ListTree className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {showToc ? "关闭目录" : "目录"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
