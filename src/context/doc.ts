import { create } from "zustand"
import { persist } from "zustand/middleware"

import { deleteDoc, loadDoc, saveDocToDb, updateDoc } from "@/lib/doc-db"
import { clearDraft, loadDraft, loadPreloadContent } from "@/lib/storage"
import { hashContent } from "@/lib/utils"
import type { DocData } from "@/types"

interface DocStoreActions {
  saveDoc: (title: string) => Promise<void>
  updateTitle: (title: string) => Promise<void>
  updateContent: () => Promise<boolean>
  addNewDoc: () => void
  initDoc: (data: Partial<DocData>) => void
}

const initialState: DocData = {
  id: "",
  title: "",
  content: "",
  updatedAt: 0,
  createdAt: 0,
  hash: "",
}

export const useDoc = create<DocData & DocStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      saveDoc: async (title) => {
        const docContent = get().content
        const result = await saveDocToDb({
          title,
          content: docContent,
          hash: hashContent(docContent),
        })
        if (result?.id) {
          set({
            id: result.id,
            title: result.title,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            hash: result.hash,
          })
        }
        clearDraft()
      },
      updateTitle: async (title) => {
        const result = await updateDoc(get().id, { title })
        if (result) {
          set({ title: result.title, updatedAt: result.updatedAt })
        }
      },
      updateContent: async () => {
        const currentContent = get().content

        const newHash = hashContent(currentContent)
        if (newHash === get().hash) {
          return false
        }

        const result = await updateDoc(get().id, { content: currentContent })
        if (result) {
          set({ updatedAt: result.updatedAt, hash: result.hash })
          return true
        }
        return false
      },
      deleteDoc: async (id: string) => {
        const result = await deleteDoc(id)
        if (result) {
          if (get().id === id) {
            get().addNewDoc()
          }
        }
      },
      addNewDoc: async () => {
        if (get().id) {
          await get().updateContent()
        }
        set(initialState)
        clearDraft()
      },
      initDoc: (data) => {
        set({
          id: data.id,
          title: data.title,
          content: data.content,
          hash: data.hash,
          updatedAt: data.updatedAt,
          createdAt: data.createdAt,
        })
      },
    }),
    {
      name: "md-editor-doc",
      partialize: (state) => ({ id: state.id }),
      onRehydrateStorage: () => async (state) => {
        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null
        const mdUrl = params?.get("md")

        if (mdUrl) {
          // Opened via service worker to view a tab's markdown content
          let content: string | null = null

          if (params?.has("local")) {
            content = await loadPreloadContent(mdUrl)
          }

          if (!content) {
            try {
              const res = await fetch(mdUrl)
              if (res.ok) {
                content = await res.text()
              }
            } catch {
              // Network error
            }
          }

          if (content) {
            const fileName = mdUrl.split("/").pop()?.split("?")[0] || "Untitled"
            state?.initDoc({
              id: "",
              content,
              title: fileName,
              hash: "",
              updatedAt: 0,
              createdAt: 0,
            })
          }

          // Clean up URL params so reload doesn't re-trigger
          window.history.replaceState({}, "", window.location.pathname)
          return
        }

        // No ?md= param — load last opened document
        if (state?.id) {
          const docData = await loadDoc(state.id)

          if (docData) {
            state.initDoc({
              id: docData.id,
              title: docData.title,
              content: docData.content,
              hash: docData.hash,
              updatedAt: docData.updatedAt,
              createdAt: docData.createdAt,
            })
            return
          }
        }

        // No ?md= param and no stored doc id — load draft from localStorage
        if (!state?.id) {
          const draft = loadDraft()
          if (draft?.content) {
            state?.initDoc({
              content: draft.content,
              title: draft.title,
            })
          }
        }
      },
    },
  ),
)
