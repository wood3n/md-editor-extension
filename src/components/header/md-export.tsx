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
import { toast } from "../ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const getDocumentName = (title: string) =>
  (title || "document").replace(/[<>:"/\\|?*]/g, "_")

const copyStylesToDocument = (target: Document) => {
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    .forEach((stylesheet) => {
      const link = target.createElement("link")
      link.rel = "stylesheet"
      link.href = stylesheet.href
      target.head.append(link)
    })

  document.querySelectorAll<HTMLStyleElement>("style").forEach((stylesheet) => {
    target.head.append(stylesheet.cloneNode(true))
  })
}

export const MdExport = () => {
  const handleDownload = () => {
    const md = useDoc.getState().content
    const { title } = useDoc.getState()
    const name = getDocumentName(title)
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${name}.md`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 0)
  }

  const handleExportPDF = async () => {
    const preview = document.querySelector<HTMLElement>(".markdown-body")
    if (!preview) {
      toast.add({ type: "error", title: "未找到 Markdown 预览内容" })
      return
    }

    // Open immediately while handling the click, so browsers do not block it as a popup.
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.add({ type: "error", title: "无法打开打印窗口，请检查浏览器的弹窗设置" })
      return
    }

    const { title } = useDoc.getState()
    const printDocument = printWindow.document
    // PDFs use a white page, so always use the matching light Markdown palette.
    printDocument.documentElement.dataset.theme = "github-light"
    printDocument.title = getDocumentName(title)
    copyStylesToDocument(printDocument)

    const printStyles = printDocument.createElement("style")
    printStyles.textContent = `
      @page { margin: 16mm; }
      html, body { background: white; }
      .markdown-body { height: auto !important; overflow: visible !important; padding: 0 !important; }
      .markdown-body pre, .markdown-body blockquote, .markdown-body table, .markdown-body img, .markdown-body svg { break-inside: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `
    printDocument.head.append(printStyles)
    printDocument.body.append(preview.cloneNode(true))

    await Promise.all([
      printDocument.fonts?.ready,
      ...[...printDocument.images].map((image) =>
        image.decode().catch(() => undefined),
      ),
    ])
    await new Promise<void>((resolve) =>
      printWindow.requestAnimationFrame(() =>
        printWindow.requestAnimationFrame(() => resolve()),
      ),
    )

    printWindow.addEventListener("afterprint", () => printWindow.close(), {
      once: true,
    })
    printWindow.focus()
    printWindow.print()
  }

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
