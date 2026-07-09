import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { oneDark } from "@codemirror/theme-one-dark";
import { editorViewCtx } from "@milkdown/core";
import mermaid from "mermaid";

interface EditorPanelProps {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

export function EditorPanel({ defaultValue, onChange, getMarkdownRef }: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }

    container.innerHTML = "";

    const crepe = new Crepe({
      root: container,
      defaultValue,
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: "请输入 Markdown 内容…",
        },
        [CrepeFeature.CodeMirror]: {
          theme: oneDark,
          renderPreview: (language, content, applyPreview) => {
            if (language === "mermaid" && content) {
              const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
              const dom = document.createElement("div");
              dom.className = "mermaid-container";
              dom.id = id;
              mermaid
                .render(`${id}-svg`, content)
                .then(({ svg }) => {
                  applyPreview(svg);
                })
                .catch((err) => {
                  applyPreview(
                    `<span style="color:#DC362E">Mermaid error: ${err.message}</span>`
                  );
                });
              return dom;
            }
            return null;
          },
        },
      },
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      if (getMarkdownRef) {
        getMarkdownRef.current = () => crepe.getMarkdown();
      }
      if (onChange) {
        crepe.on((listener) => {
          listener.markdownUpdated((_, md) => {
            onChange(md);
          });
        });
      }
      // Focus the editor after creation
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        view.focus();
      });
    });

    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      id="milkdown-editor"
    />
  );
}
