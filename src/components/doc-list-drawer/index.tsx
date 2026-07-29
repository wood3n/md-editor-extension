import { FileQuestionMark, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { useDoc } from "@/context/doc"
import { formatDate } from "@/lib/utils"

import {
  deleteDoc,
  loadDoc,
  loadDocs,
  type DocListData,
} from "../../lib/doc-db"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocListDrawer({ open, onOpenChange }: Props) {
  const [docs, setDocs] = useState<DocListData[]>([])
  const docId = useDoc((state) => state.id)

  const refresh = useCallback(async () => {
    const list = await loadDocs()
    setDocs(list)
  }, [])

  useEffect(() => {
    if (open) {
      refresh()
    }
  }, [open, refresh])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    await deleteDoc(id)
    await refresh()
  }

  const handleSelectDoc = async (id: string) => {
    const doc = await loadDoc(id)
    if (doc?.id) {
      useDoc.setState({
        ...doc,
      })
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="left">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>文档列表</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col overflow-auto">
          {docs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileQuestionMark className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>暂无已保存的文档</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2 px-2 py-4">
              {docs.map((doc) => (
                <Item
                  key={doc.id}
                  variant="outline"
                  className={docId === doc.id ? "bg-muted" : undefined}
                  onClick={() => handleSelectDoc(doc.id)}
                >
                  <ItemContent>
                    <ItemTitle>{doc.title}</ItemTitle>
                    <ItemDescription>
                      {formatDate(doc.updatedAt)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="opacity-0 transition-opacity group-hover/item:opacity-100">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => handleDelete(e, doc.id)}
                      title="删除文档"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
