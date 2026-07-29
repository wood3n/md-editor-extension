import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import XXH from "xxhashjs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Content hash for skipping redundant writes */
export function hashContent(content: string): string {
  return XXH.h32(content, 0).toString(36)
}
