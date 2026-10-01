/** Browser-only helpers for the PDF the user attaches. */

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf"
}

/** Base64 of the file content, without the `data:application/pdf;base64,` prefix. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Gagal membaca file."))
        return
      }
      const commaIndex = result.indexOf(",")
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file."))
    reader.readAsDataURL(file)
  })
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("")
}

/** FNV-1a, only used when SubtleCrypto is unavailable (non-secure context). */
function fnv1a(bytes: Uint8Array): string {
  let hash = 0x811c9dc5
  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a-${(hash >>> 0).toString(16)}-${bytes.length}`
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  if (globalThis.crypto?.subtle) {
    return `sha256-${toHex(await globalThis.crypto.subtle.digest("SHA-256", buffer))}`
  }
  return fnv1a(new Uint8Array(buffer))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
