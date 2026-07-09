/**
 * Local document store — saves markdown documents with title + timestamp.
 * Persisted to chrome.storage.local.
 */

export interface SavedDoc {
  id: string;
  title: string;
  content: string;
  createdAt: number; // Date.now()
  updatedAt: number;
}

const STORAGE_KEY = "md_saved_docs";
const MAX_DOCS = 100;

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Load all saved documents (sorted newest first) */
export async function loadDocs(): Promise<SavedDoc[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const docs: SavedDoc[] = result[STORAGE_KEY] || [];
    return docs.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/** Save a new document. Returns the created doc. */
export async function saveDoc(
  title: string,
  content: string
): Promise<SavedDoc> {
  const docs = await loadDocs();
  const doc: SavedDoc = {
    id: generateId(),
    title: title.trim() || "Untitled",
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  docs.unshift(doc);

  // Trim if exceeding max
  if (docs.length > MAX_DOCS) docs.length = MAX_DOCS;

  await chrome.storage.local.set({ [STORAGE_KEY]: docs });
  return doc;
}

/** Update an existing document's content and/or title */
export async function updateDoc(
  id: string,
  updates: { title?: string; content?: string }
): Promise<SavedDoc | null> {
  const docs = await loadDocs();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  if (updates.title !== undefined) docs[idx].title = updates.title.trim() || "Untitled";
  if (updates.content !== undefined) docs[idx].content = updates.content;
  docs[idx].updatedAt = Date.now();

  await chrome.storage.local.set({ [STORAGE_KEY]: docs });
  return docs[idx];
}

/** Load a single document by ID */
export async function loadDoc(id: string): Promise<SavedDoc | null> {
  const docs = await loadDocs();
  return docs.find((d) => d.id === id) || null;
}

/** Delete a document by ID */
export async function deleteDoc(id: string): Promise<void> {
  const docs = await loadDocs();
  const filtered = docs.filter((d) => d.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}
