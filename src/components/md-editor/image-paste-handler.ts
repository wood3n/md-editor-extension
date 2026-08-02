import type { editor } from "monaco-editor"

import { toast } from "@/components/ui/toast"
import { LOCAL_IMAGE_URL_PREFIX, saveLocalImage } from "@/lib/doc-db"

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])
const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
])

function getPastedImages(event: ClipboardEvent): Blob[] {
  return [...(event.clipboardData?.items ?? [])]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
}

function getPastedLocalImageUrls(event: ClipboardEvent): string[] {
  const uriList = event.clipboardData?.getData("text/uri-list") ?? ""

  return uriList
    .split(/\r?\n/)
    .filter((url) => url.startsWith("file://"))
    .filter((url) => {
      try {
        const path = decodeURIComponent(new URL(url).pathname)
        const extension = path.split(".").pop()?.toLowerCase()
        return extension ? SUPPORTED_IMAGE_EXTENSIONS.has(extension) : false
      } catch {
        return false
      }
    })
}

async function readClipboardImages(): Promise<Blob[]> {
  try {
    const clipboardItems = await navigator.clipboard.read()
    return Promise.all(
      clipboardItems.flatMap((item) =>
        item.types
          .filter((type) => SUPPORTED_IMAGE_TYPES.has(type))
          .map((type) => item.getType(type)),
      ),
    )
  } catch {
    return []
  }
}

async function loadLocalImagesFromUrls(urls: string[]): Promise<Blob[] | null> {
  const allowed = await chrome.extension.isAllowedFileSchemeAccess()
  if (!allowed) {
    toast.add({
      type: "warning",
      title: "需要本地文件访问权限",
      description: "请在扩展详情中开启“允许访问文件网址”后再粘贴图片。",
    })
    return null
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          return null
        }
        const image = await response.blob()
        return SUPPORTED_IMAGE_TYPES.has(image.type) ? image : null
      } catch {
        return null
      }
    }),
  )

  return results.filter((image): image is Blob => image !== null)
}

function insertImages(
  editor: editor.IStandaloneCodeEditor,
  imageIds: string[],
): void {
  const selection = editor.getSelection()
  if (!selection) {
    return
  }

  const text = imageIds
    .map((id) => `![图片](${LOCAL_IMAGE_URL_PREFIX}${id})`)
    .join("\n")

  editor.pushUndoStop()
  editor.executeEdits("image-paste", [{ range: selection, text }])
  editor.pushUndoStop()
  editor.focus()
}

async function handleImagePaste(
  event: ClipboardEvent,
  editor: editor.IStandaloneCodeEditor,
): Promise<void> {
  const clipboardImages = getPastedImages(event)
  const localImageUrls = getPastedLocalImageUrls(event)
  if (clipboardImages.length === 0 && localImageUrls.length === 0) {
    const images = await readClipboardImages()
    if (images.length > 0) {
      void insertSavedImages(editor, images)
    }
    return
  }

  event.preventDefault()

  const images =
    clipboardImages.length > 0
      ? clipboardImages
      : await loadLocalImagesFromUrls(localImageUrls)
  if (!images) {
    return
  }

  if (images.length === 0) {
    if (localImageUrls.length > 0) {
      toast.add({
        type: "error",
        title: "无法读取本地图片",
        description: "请确认文件仍存在且为支持的图片格式。",
      })
    }
    return
  }

  const unsupported = images.some(
    (image) => !SUPPORTED_IMAGE_TYPES.has(image.type),
  )
  if (unsupported) {
    toast.add({
      type: "warning",
      title: "暂不支持该图片格式",
      description: "目前仅支持 PNG、JPEG、GIF 和 WebP 图片。",
    })
    return
  }

  void insertSavedImages(editor, images)
}

async function insertSavedImages(
  editor: editor.IStandaloneCodeEditor,
  images: Blob[],
): Promise<void> {
  const imageIds = await Promise.all(
    images.map((image) => saveLocalImage(image)),
  )
  const savedImageIds = imageIds.filter((id): id is string => id !== null)

  if (savedImageIds.length === 0) {
    toast.add({
      type: "error",
      title: "图片保存失败",
      description: "请稍后再试。",
    })
    return
  }

  insertImages(editor, savedImageIds)

  if (savedImageIds.length !== images.length) {
    toast.add({
      type: "warning",
      title: "部分图片保存失败",
      description: "已插入成功保存的图片。",
    })
  }
}

export function setupImagePasteHandler(
  editor: editor.IStandaloneCodeEditor,
): void {
  const editorNode = editor.getDomNode()
  if (!editorNode) {
    return
  }

  const listener = (event: ClipboardEvent) => {
    void handleImagePaste(event, editor)
  }

  // Monaco handles paste on its hidden textarea and may stop propagation before
  // the event reaches the editor root in the bubbling phase. Capture it here so
  // image files are handled before Monaco's normal text-paste path.
  editorNode.addEventListener("paste", listener, true)
  editor.onDidDispose(() =>
    editorNode.removeEventListener("paste", listener, true),
  )
}
