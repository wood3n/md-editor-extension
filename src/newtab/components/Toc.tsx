import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function Toc({ containerRef }: TocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [scanned, setScanned] = useState(false);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scanHeadings = () => {
      const headings = container.querySelectorAll("h1, h2, h3, h4");
      const tocItems: TocItem[] = [];
      headings.forEach((heading, i) => {
        const id = heading.id || `md-heading-${i}`;
        if (!heading.id) heading.id = id;
        tocItems.push({
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName.charAt(1)),
        });
      });
      setItems(tocItems);
      setScanned(true);
    };

    const raf = requestAnimationFrame(scanHeadings);

    const observer = new MutationObserver(() => scanHeadings());
    observer.observe(container, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find the scrollable parent (the preview container)
    const scrollEl = container.closest(".overflow-y-auto") || container;

    const handleScroll = () => {
      const headings = container.querySelectorAll("h1, h2, h3, h4");
      let currentId = "";
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 120) {
          currentId = heading.id;
        }
      });
      setActiveId(currentId);
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  if (!scanned) return null;

  if (items.length === 0) {
    return (
      <div className="p-4 text-base text-muted-foreground">
        暂无标题
      </div>
    );
  }

  return (
    <nav className="p-3">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className={`block text-base py-1 px-2 rounded transition-colors hover:bg-accent truncate ${
                activeId === item.id
                  ? "text-primary font-medium bg-accent"
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
  );
}
