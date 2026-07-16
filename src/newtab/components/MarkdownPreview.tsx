import { useEffect, useMemo, useRef } from "react";
import mermaid from "mermaid";
import { cn } from "@/newtab/lib/utils";
import { PREVIEW_THEMES } from "@/newtab/lib/themes";

interface MarkdownPreviewProps {
  html: string;
  previewTheme: string;
  previewBg: string;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

export function MarkdownPreview({
  html,
  previewTheme,
  previewBg,
  className,
  containerRef,
}: MarkdownPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const themeClassName = useMemo(
    () => PREVIEW_THEMES.find((t) => t.id === previewTheme)?.className ?? "",
    [previewTheme]
  );

  // Run mermaid on HTML change
  useEffect(() => {
    if (!contentRef.current) return;

    const mermaidEls = contentRef.current.querySelectorAll<HTMLElement>(".mermaid");
    if (mermaidEls.length === 0) return;

    mermaidEls.forEach((el) => el.removeAttribute("data-processed"));

    try {
      mermaid.run({ nodes: Array.from(mermaidEls) });
    } catch { /* ignore */ }
  }, [html]);

  return (
    <div
      ref={(node) => {
        (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (containerRef) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className={cn("flex-1 overflow-y-auto p-6", "md-theme", themeClassName, className)}
      style={{ "--md-bg": previewBg } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
