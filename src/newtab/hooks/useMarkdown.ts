import { useState, useCallback, useRef } from "react";

export function useMarkdown(initialValue: string) {
  const [content, setContent] = useState(initialValue);
  const editorRef = useRef<any>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  return {
    content,
    setContent: updateContent,
    editorRef,
  };
}
