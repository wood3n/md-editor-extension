import { useEffect, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import type { Editor as ToastEditor } from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import mermaid from "mermaid";

interface EditorPanelProps {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>;
  dark?: boolean;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

export function EditorPanel({ defaultValue, onChange, getMarkdownRef, dark }: EditorPanelProps) {
  // The ref from @toast-ui/react-editor exposes getInstance() to access
  // the underlying TOAST UI Editor instance.
  const editorRef = useRef<Editor>(null);

  const getInstance = (): ToastEditor | null => {
    return editorRef.current?.getInstance() ?? null;
  };

  // Set up getMarkdownRef and initial theme after the editor loads.
  const handleLoad = () => {
    const instance = getInstance();
    if (!instance) return;

    if (getMarkdownRef) {
      getMarkdownRef.current = () => instance.getMarkdown();
    }

    instance.setTheme(dark ? "dark" : "light");
  };

  // Theme switching without remount.
  useEffect(() => {
    const instance = getInstance();
    if (instance) {
      instance.setTheme(dark ? "dark" : "light");
    }
  }, [dark]);

  // Clean up getMarkdownRef on unmount.
  useEffect(() => {
    return () => {
      if (getMarkdownRef) {
        getMarkdownRef.current = null;
      }
    };
  }, [getMarkdownRef]);

  return (
    <div id="toast-editor" className="h-full overflow-hidden">
      <Editor
        ref={editorRef}
        initialValue={defaultValue}
        previewStyle="vertical"
        initialEditType="markdown"
        height="100%"
        useCommandShortcut={true}
        hideModeSwitch={false}
        onLoad={handleLoad}
        onChange={() => {
          const instance = getInstance();
          if (instance) {
            onChange?.(instance.getMarkdown());
          }
        }}
        customHTMLRenderer={{
          codeBlock(node, context) {
            if (node.info === "mermaid" && node.literal) {
              const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
              mermaid
                .render(`${id}-svg`, node.literal)
                .then(({ svg }: { svg: string }) => {
                  const el = document.getElementById(id);
                  if (el) el.innerHTML = svg;
                })
                .catch((err: Error) => {
                  const el = document.getElementById(id);
                  if (el)
                    el.innerHTML = `<span style="color:#DC362E">Mermaid error: ${err.message}</span>`;
                });
              return [
                {
                  type: "openTag",
                  tagName: "div",
                  classNames: ["mermaid-container"],
                  attributes: { id },
                  outerNewLine: true,
                },
                { type: "closeTag", tagName: "div", outerNewLine: true },
              ];
            }
            // Non-mermaid: use the default renderer.
            return context.origin();
          },
        }}
      />
    </div>
  );
}
