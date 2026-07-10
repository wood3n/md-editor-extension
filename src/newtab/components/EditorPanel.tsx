import { useEffect, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
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

const DARK_THEME_CLASS = "toastui-editor-dark";

export function EditorPanel({ defaultValue, onChange, getMarkdownRef, dark }: EditorPanelProps) {
  // The ref from @toast-ui/react-editor exposes getInstance() to access
  // the underlying TOAST UI Editor instance.
  const editorRef = useRef<Editor>(null);

  const getInstance = () => {
    return editorRef.current?.getInstance() ?? null;
  };

  // Toggle the dark theme CSS class on the editor's root element.
  // TOAST UI Editor applies theme as a class at construction time;
  // there is no runtime setTheme() API, so we toggle the class directly.
  const applyTheme = (isDark: boolean) => {
    const rootEl = editorRef.current?.getRootElement();
    if (!rootEl) return;
    if (isDark) {
      rootEl.classList.add(DARK_THEME_CLASS);
    } else {
      rootEl.classList.remove(DARK_THEME_CLASS);
    }
  };

  // Set up getMarkdownRef and initial theme after the editor loads.
  const handleLoad = () => {
    const instance = getInstance();
    if (!instance) return;

    if (getMarkdownRef) {
      getMarkdownRef.current = () => instance.getMarkdown();
    }

    applyTheme(!!dark);
  };

  // Theme switching without remount.
  useEffect(() => {
    applyTheme(!!dark);
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
        theme={dark ? "dark" : "light"}
        onLoad={handleLoad}
        onChange={() => {
          const instance = getInstance();
          if (instance) {
            onChange?.(instance.getMarkdown());
          }
        }}
        customHTMLRenderer={{
          codeBlock(node: any, context: any) {
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
