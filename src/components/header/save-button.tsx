import { CircleCheck, Save } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDoc } from "@/context/doc"

import { toast } from "../ui/toast"

const DISPLAY_DURATION = 1500

interface SaveButtonProps {
  saveCount?: number
  onRequestSaveDialog: () => void
}

export function SaveButton({
  saveCount,
  onRequestSaveDialog,
}: SaveButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSuccess = () => {
    setShowSuccess(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => setShowSuccess(false), DISPLAY_DURATION)
  }

  // Watch auto-save (saveCount increment) to show success
  useEffect(() => {
    if (saveCount && saveCount > 0) {
      triggerSuccess()
    }
  }, [saveCount])

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  const handleClick = async () => {
    const docId = useDoc.getState().id

    if (!docId) {
      onRequestSaveDialog()
      return
    }

    const saved = await useDoc.getState().updateContent()
    if (saved) {
      triggerSuccess()
      toast.add({ type: "success" })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
            disabled={showSuccess}
            type="button"
          >
            {showSuccess ? (
              <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <TooltipContent>
        {showSuccess ? "已保存" : "保存文档 (⌘S)"}
      </TooltipContent>
    </Tooltip>
  )
}
