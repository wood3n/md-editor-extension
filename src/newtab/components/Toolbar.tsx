import {
  Save,
  Plus,
  FileDown,
  MoreHorizontal,
  Palette,
  PanelLeftOpen,
  PanelLeftClose,
  Pencil,
  Check,
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/newtab/lib/utils";
import { THEME_PRESETS, type ThemePreset } from "@/newtab/lib/themes";

interface ToolbarProps {
  onExportPdf: () => void;
  onExportMd: () => void;
  onSave: () => void;
  onNewDoc: () => void;
  onEditDoc?: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  docTitle?: string;
  docTime?: string;
  currentTheme: string;
  onThemeChange: (preset: ThemePreset) => void;
  className?: string;
}

export function Toolbar({
  onExportPdf,
  onExportMd,
  onSave,
  onNewDoc,
  onEditDoc,
  sidebarOpen,
  onToggleSidebar,
  docTitle,
  docTime,
  currentTheme,
  onThemeChange,
  className,
}: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center h-12 px-3 border-b shrink-0 gap-2",
        className
      )}
      style={{ backgroundColor: "var(--chrome-bg)", borderColor: "var(--chrome-border)" }}
    >
      {/* 侧边栏开关 */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            type="button"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
        </TooltipContent>
      </Tooltip>

      {/* 文档标题和日期 */}
      {docTitle && (
        <div className="group flex items-center gap-1 ml-1 min-w-0">
          <span className="text-sm font-medium truncate">{docTitle}</span>
          {docTime && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              · {docTime}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all"
            onClick={onEditDoc}
            type="button"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}

      <div className="flex-1" />

      {/* 新建 */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="outline" size="icon" onClick={onNewDoc} type="button">
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>新建文档</TooltipContent>
      </Tooltip>

      {/* 保存 */}
      <Tooltip>
        <TooltipTrigger>
          <Button variant="outline" size="icon" onClick={onSave} type="button">
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>保存到本地 (⌘S)</TooltipContent>
      </Tooltip>

      {/* 导出按钮组 */}
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon"
              onClick={onExportMd}
              className="rounded-r-none"
              type="button"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>下载 Markdown</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger>
              <DropdownMenuTrigger>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0"
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>更多</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPdf}>
              <FileDown className="h-3.5 w-3.5 mr-2" />
              导出 HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 主题切换 */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button variant="outline" size="icon" type="button">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>主题</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">选择主题</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {THEME_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onThemeChange(preset)}
              className="text-xs"
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 mr-2",
                  currentTheme === preset.id ? "opacity-100" : "opacity-0"
                )}
              />
              {preset.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
