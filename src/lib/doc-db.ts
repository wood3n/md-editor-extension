import { type DocData } from "@/types"

const DB_NAME = "md-editor-docs"
const DB_VERSION = 2
const STORE_NAME = "docs"
const MAX_DOCS = 999
const ID_RADIX = 36
const ID_SUFFIX_LENGTH = 5
const UPDATED_AT_INDEX = "updatedAt"

let dbPromise: Promise<IDBDatabase> | null = null

function generateId(): string {
  return `doc_${Date.now()}_${Math.random()
    .toString(ID_RADIX)
    .slice(2, 2 + ID_SUFFIX_LENGTH)}`
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.addEventListener("upgradeneeded", () => {
      const database = request.result
      const { transaction } = request

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex(UPDATED_AT_INDEX, UPDATED_AT_INDEX, { unique: false })
        return
      }

      if (!transaction) {
        return
      }

      const store = transaction.objectStore(STORE_NAME)
      if (!store.indexNames.contains(UPDATED_AT_INDEX)) {
        store.createIndex(UPDATED_AT_INDEX, UPDATED_AT_INDEX, { unique: false })
      }
    })

    request.addEventListener("success", () => {
      resolve(request.result)
    })

    request.addEventListener("error", () => {
      reject(request.error)
    })
  })

  return dbPromise
}

function createRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result))
    request.addEventListener("error", () => reject(request.error))
  })
}

function commitTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve())
    transaction.addEventListener("error", () => reject(transaction.error))
    transaction.addEventListener("abort", () => reject(transaction.error))
  })
}

/** Load lightweight document summaries for the list view */
export type DocListData = Pick<DocData, "id" | "title" | "updatedAt">
export async function loadDocs(): Promise<DocListData[]> {
  try {
    const database = await openDb()
    const transaction = database.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index(UPDATED_AT_INDEX)

    const docs: DocListData[] = []
    const cursorRequest = index.openCursor(null, "prev")

    await new Promise<void>((resolve, reject) => {
      cursorRequest.addEventListener("success", () => {
        const cursor = cursorRequest.result
        if (!cursor) {
          resolve()
          return
        }

        docs.push({
          id: cursor.value.id,
          title: cursor.value.title,
          updatedAt: cursor.value.updatedAt,
        })

        cursor.continue()
      })
      cursorRequest.addEventListener("error", () => reject(cursorRequest.error))
    })

    return docs
  } catch {
    return []
  }
}

/** Save a new document. Returns the created doc. */
export async function saveDocToDb({
  title,
  content,
  hash,
}: {
  title: string
  content: string
  hash: string
}): Promise<DocData | null> {
  const doc: DocData = {
    id: generateId(),
    title,
    content,
    hash,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  try {
    const database = await openDb()
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const existingDocs = await createRequest<DocData[]>(store.getAll())

    const excessDocs = [doc, ...existingDocs]
      .toSorted((a, b) => b.updatedAt - a.updatedAt)
      .slice(MAX_DOCS)

    await createRequest(store.put(doc))

    await Promise.all(
      excessDocs.map((item) => createRequest(store.delete(item.id))),
    )
    await commitTransaction(transaction)

    return doc
  } catch {
    return null
  }
}

/** Update an existing document's content and/or title */
export async function updateDoc(
  id: string,
  updates: { title?: string; hash?: string; content?: string },
): Promise<DocData | null> {
  try {
    const database = await openDb()
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const currentDoc = await createRequest<DocData | undefined>(store.get(id))

    if (!currentDoc) {
      return null
    }

    const nextDoc: DocData = {
      ...currentDoc,
      title:
        updates.title !== undefined
          ? updates.title.trim() || "Untitled"
          : currentDoc.title,
      content:
        updates.content !== undefined ? updates.content : currentDoc.content,
      hash: updates.hash ?? currentDoc.hash,
      updatedAt: Date.now(),
    }

    await createRequest(store.put(nextDoc))

    await commitTransaction(transaction)

    return nextDoc
  } catch {
    return null
  }
}

/** Load a single document by ID */
export async function loadDoc(id: string): Promise<DocData | null> {
  try {
    const database = await openDb()
    const transaction = database.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const doc = await createRequest<DocData | undefined>(store.get(id))
    return doc || null
  } catch {
    return null
  }
}

/** Delete a document by ID */
export async function deleteDoc(id: string): Promise<boolean> {
  const database = await openDb()
  const transaction = database.transaction(STORE_NAME, "readwrite")
  const store = transaction.objectStore(STORE_NAME)

  await createRequest(store.delete(id))
  await commitTransaction(transaction)
  return true
}
