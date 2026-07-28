import { Save, Plus, Pencil, List } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDoc } from "@/context/doc"
import { formatDate } from "@/lib/utils"

import { DocListDrawer } from "../doc-list-drawer"
import { DocRenameDialog } from "./doc-rename-dialog"
import { DocSaveDialog } from "./doc-save-dialog"
import { MdExport } from "./md-export"
import { ThemeSelect } from "./theme-select"

export function Header() {
  const [openDocList, setOpenDocList] = useState(false)
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [openRenameDialog, setOpenRenameDialog] = useState(false)
  const docId = useDoc((state) => state.id)
  const docTitle = useDoc((state) => state.title)
  const docUpdateDate = useDoc((state) => state.updatedAt)

  const handleSave = () => {
    if (!docId) {
      setOpenSaveDialog(true)
    } else {
      useDoc.getState().saveContent()
    }
  }

  return (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOpenDocList(true)}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          {docTitle && (
            <div className="group ml-1 flex min-w-0 items-center gap-1">
              <span className="truncate text-base font-medium">{docTitle}</span>
              {docUpdateDate && (
                <span className="text-sm whitespace-nowrap text-muted-foreground">
                  · {formatDate(docUpdateDate)}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-all group-hover:opacity-100"
                onClick={() => setOpenRenameDialog(true)}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-x-1">
          {/* 新建 */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={useDoc.getState().addNewDoc}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent>新建文档</TooltipContent>
          </Tooltip>

          {/* 保存 */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSave}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent>保存文档 (⌘S)</TooltipContent>
          </Tooltip>

          {/* 导出按钮组 */}
          <MdExport />

          {/* 主题切换 */}
          <ThemeSelect />
        </div>
      </div>
      <DocListDrawer open={openDocList} onOpenChange={setOpenDocList} />
      <DocSaveDialog open={openSaveDialog} onOpenChange={setOpenSaveDialog} />
      <DocRenameDialog
        open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
      />
    </>
  )
}
