const DRAFT_KEY = "md_editor_draft"

export interface DraftData {
  title: string
  content: string
}

export function saveDraft(data: DraftData): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as DraftData
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

// ── Tab markdown preload (chrome.storage.session) ──

const PRELOAD_KEY_PREFIX = "md_preload_"

export function savePreloadContent(
  url: string,
  content: string,
): Promise<void> {
  return chrome.storage.session.set({
    [PRELOAD_KEY_PREFIX + url]: { content, timestamp: Date.now() },
  })
}

export async function loadPreloadContent(url: string): Promise<string | null> {
  try {
    const key = PRELOAD_KEY_PREFIX + url
    const data = (await chrome.storage.session.get(key)) as any
    return data[key]?.content || null
  } catch {
    return null
  }
}
