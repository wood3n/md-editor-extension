import { useState, useRef, useCallback } from "react"

import { useDoc } from "@/context/doc"
import { clearDraft, saveDraft } from "@/lib/storage"

const AUTO_SAVE_DELAY = 2000

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveCount, setSaveCount] = useState(0)

  const performSave = useCallback(async () => {
    const state = useDoc.getState()
    const isEmpty = !state.content.trim()

    if (state.id) {
      const saved = await state.updateContent()
      if (saved) {
        setSaveCount((c) => c + 1)
      }
    } else {
      // Temporary document: clear draft when empty, otherwise save
      if (isEmpty) {
        clearDraft()
        return
      }
      saveDraft({ title: state.title, content: state.content })
      setSaveCount((c) => c + 1)
    }
  }, [])

  // Called on every user edit (via MDEditor onChange — only fires on user input)
  const onUserEdit = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(performSave, AUTO_SAVE_DELAY)
  }, [performSave])

  // Save immediately on blur
  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    performSave()
  }, [performSave])

  return { saveNow, onUserEdit, saveCount }
}
