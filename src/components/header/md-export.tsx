import { FileDown, MoreHorizontalIcon } from "lucide-react"

import { useDoc } from "@/context/doc"

import { Button } from "../ui/button"
import { ButtonGroup } from "../ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

export const MdExport = () => {
  const handleDownload = () => {
    const md = useDoc.getState().content
    const { title } = useDoc.getState()
    const name = (title || "document").replace(/[<>:"/\\|?*]/g, "_")
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${name}.md`
    a.click()
  }

  const handleExportPDF = () => {}

  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              className="rounded-r-none"
              type="button"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          }
        />

        <TooltipContent>下载 Markdown</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" aria-label="More Options">
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportPDF}>
            <FileDown />
            导出 PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
