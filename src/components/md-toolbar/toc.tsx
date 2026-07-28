import { ListTree } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import type { MDPreviewHandle } from "@/components/md-preview"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TocItem {
  id: string
  text: string
  level: number
}

interface TocProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function Toc({ containerRef }: TocProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [scanned, setScanned] = useState(false)
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const scanHeadings = () => {
      const headings = container.querySelectorAll("h1, h2, h3, h4")
      const tocItems: TocItem[] = []
      headings.forEach((heading, i) => {
        const id = heading.id || `md-heading-${i}`
        if (!heading.id) {
          heading.id = id
        }
        tocItems.push({
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName.charAt(1)),
        })
      })
      setItems(tocItems)
      setScanned(true)
    }

    const raf = requestAnimationFrame(scanHeadings)

    const observer = new MutationObserver(() => scanHeadings())
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    // Find the scrollable parent (the preview container)
    const scrollEl = container.closest(".overflow-y-auto") || container

    const handleScroll = () => {
      const headings = container.querySelectorAll("h1, h2, h3, h4")
      let currentId = ""
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 120) {
          currentId = heading.id
        }
      })
      setActiveId(currentId)
    }

    scrollEl.addEventListener("scroll", handleScroll, { passive: true })
    return () => scrollEl.removeEventListener("scroll", handleScroll)
  }, [containerRef])

  if (!scanned) {
    return null
  }

  if (items.length === 0) {
    return <div className="p-4 text-base text-muted-foreground">暂无标题</div>
  }

  return (
    <nav className="p-3">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(item.id)
                if (el) {
                  el.scrollIntoView({ behavior: "instant", block: "start" })
                }
              }}
              className={`block truncate rounded px-2 py-1 text-base hover:bg-muted transition-none ${
                activeId === item.id
                  ? "bg-muted font-medium"
                  : "text-muted-foreground"
              }`}
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface TocButtonProps {
  previewRef: React.RefObject<MDPreviewHandle | null>
}

export function TocButton({ previewRef }: TocButtonProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    containerRef.current = previewRef.current?.scrollContainer ?? null
  })

  return (
    <Popover open={open} onOpenChange={(o, details) => {
      if (!o && details?.reason !== "trigger-press") return
      setOpen(o)
    }}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant={open ? "outline" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  type="button"
                >
                  <ListTree className="h-4 w-4" />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="bottom">目录</TooltipContent>
      </Tooltip>
      <PopoverContent
        side="bottom"
        align="end"
        className="max-h-80 w-60 overflow-y-auto p-0 data-open:animate-none data-closed:animate-none"
      >
        <Toc containerRef={containerRef} />
      </PopoverContent>
    </Popover>
  )
}
