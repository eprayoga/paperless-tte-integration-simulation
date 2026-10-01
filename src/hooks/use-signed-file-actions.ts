"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { toApiError } from "@/lib/api-error"
import { toSafeExternalUrl } from "@/lib/format"
import { toStatusPatch } from "@/services/paperless/paperless.mapper"
import { paperlessService } from "@/services/paperless/paperless.service"
import { useDocumentStore } from "@/stores/document.store"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem } from "@/types/document"

export type SignedFileKind = "download" | "preview"

/**
 * Signed file URLs are never stored. Each click fetches the latest status and
 * opens `file.download` / `file.preview` from that response.
 */
export function useSignedFileActions() {
  const applyStatus = useDocumentStore((state) => state.applyStatus)

  const openSignedFile = useCallback(
    async (document: DocumentItem, kind: SignedFileKind) => {
      if (document.status !== "success" || !document.trxId) return
      const { startAction, endAction } = useUiStore.getState()
      if (!startAction(document.id, "opening")) return

      // Open the tab synchronously (inside the click) so popup blockers allow it.
      const tab = window.open("", "_blank")
      if (tab) {
        tab.opener = null
        tab.document.title = "Membuka dokumen..."
        tab.document.body.textContent = "Mengambil file dari Paperless..."
      }

      const toastId = toast.loading(`Menyiapkan ${kind} dokumen...`)
      try {
        const data = await paperlessService.getSignStatus(document.trxId)
        applyStatus(document.id, toStatusPatch(data))

        const url = toSafeExternalUrl(
          kind === "download" ? data.file?.download : data.file?.preview,
        )
        if (data.status.toLowerCase() !== "completed" || !url) {
          tab?.close()
          toast.error(`File ${kind} belum tersedia.`, { id: toastId })
          return
        }

        if (tab) {
          tab.location.href = url
        } else {
          window.open(url, "_blank", "noopener,noreferrer")
        }
        toast.success(`Membuka ${kind} dokumen.`, { id: toastId })
      } catch (error) {
        tab?.close()
        const apiError = toApiError(error)
        if (apiError.isUnauthorized) {
          toast.dismiss(toastId)
          return
        }
        toast.error(`Gagal membuka ${kind} dokumen.`, {
          id: toastId,
          description: apiError.message,
        })
      } finally {
        endAction(document.id)
      }
    },
    [applyStatus],
  )

  const openVerification = useCallback((document: DocumentItem) => {
    const url = toSafeExternalUrl(document.verificationLink)
    if (!url) {
      toast.error("Link verifikasi tidak tersedia.")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }, [])

  return { openSignedFile, openVerification }
}
