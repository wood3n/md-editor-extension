import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { SavedDoc, loadDocs, deleteDoc } from "../lib/doc-store";
import { cn } from "../lib/utils";

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
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!open) return null;

  return (
    <div className="w-60 h-full border-r bg-background shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          文档列表
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
        {docs.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">
            暂无保存的文档
          </p>
        ) : (
          <ul className="py-1">
            {docs.map((doc) => (
              <li
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                onMouseEnter={() => setHoverId(doc.id)}
                onMouseLeave={() => setHoverId(null)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent",
                  activeDocId === doc.id && "bg-accent"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{doc.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(doc.updatedAt)}
                  </p>
                </div>
                {hoverId === doc.id && (
                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors shrink-0 ml-1"
                    title="删除文档"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
