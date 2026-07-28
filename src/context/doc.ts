import { create } from "zustand"

import { deleteDoc, saveDoc, updateDoc } from "@/lib/doc-db"
import type { DocData } from "@/types"

interface DocActions {
  saveDoc: (title: string) => Promise<void>
  updateTitle: (title: string) => Promise<void>
  saveContent: () => Promise<void>
  addNewDoc: () => void
}

const initialState: DocData = {
  id: "",
  title: "",
  content: "",
  updatedAt: 0,
  createdAt: 0,
}

export const useDoc = create<DocData & DocActions>((set, get) => ({
  ...initialState,
  saveDoc: async (title) => {
    const result = await saveDoc({
      title,
      content: get().content,
    })
    if (result?.id) {
      set({
        id: result.id,
        title: result.title,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      })
    }
  },
  updateTitle: async (title) => {
    const result = await updateDoc(get().id, { title })
    if (result) {
      set({ title: result.title, updatedAt: result.updatedAt })
    }
  },
  saveContent: async () => {
    const currentContent = get().content
    const result = await updateDoc(get().id, { content: currentContent })
    if (result) {
      set({ updatedAt: result.updatedAt })
    }
  },
  deleteDoc: async (id: string) => {
    await deleteDoc(id)
  },
  addNewDoc: () => {
    if (get().id) {
      get().saveContent()
    }
    set(initialState)
  },
}))
