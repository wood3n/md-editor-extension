import { useState, useEffect, useRef } from "react";
import { getMdParam } from "../lib/detect-markdown";
import { fetchWithCache } from "../lib/cache";

const STORAGE_KEY_PREFIX = "md_preload_";

/** Check if fetched content appears to be HTML rather than Markdown */
function looksLikeHtml(content: string): boolean {
  const trimmed = content.trimStart();
  const htmlPatterns = [
    /^<!DOCTYPE\s/i,
    /^<html[\s>]/i,
    /^<head[\s>]/i,
    /^<body[\s>]/i,
    /^<\?xml/i,
    /^<meta\s/i,
    /^<title[\s>]/i,
  ];
  return htmlPatterns.some((pattern) => pattern.test(trimmed));
}

async function readPreloadedContent(url: string): Promise<string | null> {
  try {
    const key = STORAGE_KEY_PREFIX + url;
    const result = await chrome.storage.local.get(key);
    const entry = result[key];
    if (entry?.content && typeof entry.content === "string" && entry.content.trim()) {
      chrome.storage.local.remove(key);
      return entry.content;
    }
  } catch {
    // chrome.storage may not be available
  }
  return null;
}

export function useCurrentTabUrl() {
  const [mdUrl, setMdUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedContent, setLoadedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const url = getMdParam();
    if (!url) return;

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setMdUrl(url);
    setLoading(true);

    const params = new URLSearchParams(window.location.search);
    const isLocal = params.get("local") === "true";

    const loadContent = isLocal
      ? readPreloadedContent(url).then((preloaded) => {
          if (preloaded) return preloaded;
          return fetchWithCache(url);
        })
      : fetchWithCache(url);

    loadContent
      .then((text) => {
        if (looksLikeHtml(text)) {
          setError("该链接不是有效的 Markdown 文件（检测到 HTML）");
          setLoadedContent(null);
        } else {
          setLoadedContent(text);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { mdUrl, loading, loadedContent, error };
}
