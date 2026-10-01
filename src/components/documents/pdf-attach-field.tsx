"use client"

import {
  ArrowsClockwiseIcon,
  FileArrowUpIcon,
  FilePdfIcon,
  SealCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { useId, useRef, useState, type ChangeEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { formatFileSize, hashFile, isPdfFile } from "@/lib/file"
import { cn } from "@/lib/utils"
import { useSessionFileStore } from "@/stores/session-file.store"
import type { DocumentItem } from "@/types/document"

type PdfAttachFieldProps = {
  document: Pick<DocumentItem, "id" | "fileHash" | "fileName" | "fileSize">
  disabled?: boolean
  className?: string
}

/**
 * Re-attach the document's PDF. The file must hash to `document.fileHash`;
 * it is kept in memory only (useSessionFileStore), never in browser storage.
 */
export function PdfAttachField({ document, disabled, className }: PdfAttachFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const file = useSessionFileStore((state) => state.files[document.id])
  const setFile = useSessionFileStore((state) => state.setFile)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ""
    if (!selected) return

    setError(null)
    if (!isPdfFile(selected)) {
      setError("File harus berformat PDF (application/pdf).")
      return
    }
    setVerifying(true)
    try {
      const hash = await hashFile(selected)
      if (hash !== document.fileHash) {
        setError(
          `File tidak sesuai dengan dokumen ini. Pilih file "${document.fileName}" yang sama seperti saat dokumen dibuat.`,
        )
        return
      }
      setFile(document.id, selected)
    } catch {
      setError("Gagal membaca file. Coba pilih ulang.")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(event) => void handleChange(event)}
        disabled={disabled || verifying}
      />

      {file ? (
        <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
          <FilePdfIcon className="size-8 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
          </div>
          <Badge
            variant="outline"
            className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex"
          >
            <SealCheckIcon />
            Terverifikasi
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || verifying}
            onClick={() => inputRef.current?.click()}
          >
            <ArrowsClockwiseIcon />
            Ganti
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "hover:border-primary/60 hover:bg-primary/5 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors",
            (disabled || verifying) && "pointer-events-none opacity-60",
            error && "border-destructive/50",
          )}
        >
          {verifying ? (
            <Spinner className="size-6" />
          ) : (
            <FileArrowUpIcon className="text-primary size-8" />
          )}
          <span className="text-sm font-medium">
            {verifying ? "Memverifikasi file..." : "Pilih ulang file PDF dokumen"}
          </span>
          <span className="text-muted-foreground text-xs">
            {document.fileName} · {formatFileSize(document.fileSize)}
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="text-destructive flex items-start gap-1.5 text-sm">
          <WarningCircleIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
