/**
 * Markdown URL content cache.
 *
 * Two-layer cache:
 * 1. In-memory Map — instant lookup, lost on page unload
 * 2. chrome.storage.local — survives page reloads / extension restarts
 *
 * Uses ETag / If-None-Match for conditional requests to avoid
 * re-downloading unchanged content. Falls back to Last-Modified.
 */

interface CacheEntry {
  content: string;
  etag: string | null;
  lastModified: string | null;
  timestamp: number; // Date.now() when cached
}

interface StorageCacheData {
  [url: string]: CacheEntry;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — serve from cache, no network
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours — max validity, conditional re-fetch after TTL
const MAX_CACHE_ENTRIES = 50; // prevent chrome.storage bloat

const STORAGE_KEY = "mdCache";

// ---------------------------------------------------------------------------
// In-memory layer
// ---------------------------------------------------------------------------
const memoryCache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExpired(entry: CacheEntry, ttlMs: number): boolean {
  return Date.now() - entry.timestamp > ttlMs;
}

function isStale(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > DEFAULT_CACHE_TTL_MS;
}

function isTooOld(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > MAX_CACHE_AGE_MS;
}

function buildConditionalHeaders(entry: CacheEntry): HeadersInit {
  const headers: HeadersInit = {};
  if (entry.etag) {
    headers["If-None-Match"] = entry.etag;
  }
  if (entry.lastModified) {
    headers["If-Modified-Since"] = entry.lastModified;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// chrome.storage.local persistence
// ---------------------------------------------------------------------------

async function loadStorageCache(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data: StorageCacheData = result[STORAGE_KEY];
    if (data && typeof data === "object") {
      for (const [url, entry] of Object.entries(data)) {
        // Only load into memory if not already there and not too old
        if (!memoryCache.has(url) && !isTooOld(entry)) {
          memoryCache.set(url, entry);
        }
      }
    }
  } catch {
    // chrome.storage may not be available (e.g. in dev without extension context)
  }
}

async function persistCache(): Promise<void> {
  try {
    const data: StorageCacheData = {};
    for (const [url, entry] of memoryCache) {
      if (!isTooOld(entry)) {
        data[url] = entry;
      }
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  } catch {
    // non-fatal — cache just won't survive page reload
  }
}

/** Trim oldest entries when exceeding the max */
function evictOldest(): void {
  if (memoryCache.size <= MAX_CACHE_ENTRIES) return;

  const entries = Array.from(memoryCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
  for (const [url] of toDelete) {
    memoryCache.delete(url);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch markdown content for a URL, using cache when possible.
 *
 * Strategy:
 * - Within TTL → serve from cache immediately (no network)
 * - After TTL but before max age → conditional GET with ETag/Last-Modified
 * - Beyond max age → full fetch
 */
export async function fetchWithCache(url: string): Promise<string> {
  // 1. Check memory cache (if within TTL, return immediately)
  const memEntry = memoryCache.get(url);
  if (memEntry && !isExpired(memEntry, DEFAULT_CACHE_TTL_MS)) {
    return memEntry.content;
  }

  // 2. Build conditional headers if we have a stale-but-valid entry
  const conditionalHeaders =
    memEntry && !isTooOld(memEntry) ? buildConditionalHeaders(memEntry) : {};

  // 3. Fetch (conditional or full)
  const response = await fetch(url, {
    headers: conditionalHeaders,
  });

  if (response.status === 304) {
    // Not Modified — refresh timestamp on existing entry
    if (memEntry) {
      memEntry.timestamp = Date.now();
      memoryCache.set(url, memEntry);
      evictOldest();
      persistCache();
    }
    return memEntry!.content;
  }

  if (!response.ok) {
    // If fetch fails but we have stale cache, serve it as fallback
    if (memEntry) {
      return memEntry.content;
    }
    throw new Error(`HTTP ${response.status}`);
  }

  // 4. Store fresh response
  const content = await response.text();
  const entry: CacheEntry = {
    content,
    etag: response.headers.get("ETag") || null,
    lastModified: response.headers.get("Last-Modified") || null,
    timestamp: Date.now(),
  };

  memoryCache.set(url, entry);
  evictOldest();
  persistCache();

  return content;
}

/**
 * Pre-load the storage layer into memory.
 * Call once at app startup.
 */
export async function initCache(): Promise<void> {
  await loadStorageCache();
}
