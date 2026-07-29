import { CircleCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const DISPLAY_DURATION = 1500

export function SaveStatus({ saveCount }: { saveCount?: number }) {
  const [show, setShow] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveCount && saveCount > 0) {
      setShow(true)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => setShow(false), DISPLAY_DURATION)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [saveCount])

  if (!show) {
    return null
  }

  return (
    <span
      className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400"
      aria-live="polite"
    >
      <CircleCheck className="h-3.5 w-3.5" />
      已保存
    </span>
  )
}
