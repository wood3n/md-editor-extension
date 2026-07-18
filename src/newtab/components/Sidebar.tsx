import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { SavedDoc, loadDocs, deleteDoc } from "../lib/doc-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/newtab/lib/utils";

interface SidebarProps {
  open: boolean;
  activeDocId: string | null;
  onSelectDoc: (doc: SavedDoc) => void;
  onDeleteDoc?: (id: string) => void;
  refreshKey?: number;
}

export function Sidebar({ open, activeDocId, onSelectDoc, onDeleteDoc, refreshKey }: SidebarProps) {
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await loadDocs();
    setDocs(list);
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refreshKey, refresh]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDoc(id);
    onDeleteDoc?.(id);
    await refresh();
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  if (!open) return null;

  return (
    <div
      className="w-60 h-full border-r shrink-0 flex flex-col"
      style={{ backgroundColor: "var(--chrome-bg)", borderColor: "var(--chrome-border)" }}
    >
      <div className="flex items-center px-3 border-b" style={{ height: "45px" }}>
        <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
          文档列表
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
        {docs.length === 0 ? (
          <p className="px-4 py-6 text-base text-muted-foreground text-center">
            暂无保存的文档
          </p>
        ) : (
          <ul className="py-1">
            {docs.map((doc) => (
              <li
                key={doc.id}
                onMouseEnter={() => setHoverId(doc.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelectDoc(doc)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors",
                  activeDocId === doc.id && "font-medium"
                )}
                style={{
                  backgroundColor: activeDocId === doc.id ? "var(--chrome-active)" : (hoverId === doc.id ? "var(--chrome-hover)" : "transparent"),
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium truncate">{doc.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(doc.updatedAt)}
                  </p>
                </div>
                {hoverId === doc.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 ml-1 text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={(e) => handleDelete(e, doc.id)}
                    title="删除文档"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
